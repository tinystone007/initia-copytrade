// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SimpleAMM, IERC20} from "./SimpleAMM.sol";

contract CopyTradeRouter {
    SimpleAMM public immutable amm;
    address public owner;
    address public feeCollector;

    uint256 public copyFeeRate = 30; // 0.3% in basis points (30 / 10000)
    uint256 public constant MAX_FOLLOWERS_PER_TRADER = 50;

    struct TraderInfo {
        string initUsername;
        bool isActive;
        uint256 totalTrades;
        uint256 totalVolume;
        uint256 followerCount;
        uint256 registeredAt;
    }

    struct FollowPosition {
        bool isActive;
        uint256 depositedAt;
    }

    mapping(address => TraderInfo) public traders;
    address[] public traderList;

    // follower => trader => token => balance
    mapping(address => mapping(address => mapping(address => uint256))) public followerBalances;

    // trader => followers array
    mapping(address => address[]) public traderFollowers;

    // follower => trader => FollowPosition
    mapping(address => mapping(address => FollowPosition)) public followPositions;

    event TraderRegistered(address indexed trader, string initUsername);
    event TraderUnregistered(address indexed trader);
    event Followed(address indexed follower, address indexed trader, address token, uint256 amount);
    event Unfollowed(address indexed follower, address indexed trader);
    event LeaderTradeExecuted(address indexed leader, uint256 indexed pairId, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);
    event CopyTradeExecuted(address indexed leader, address indexed follower, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    constructor(address _amm, address _feeCollector) {
        amm = SimpleAMM(_amm);
        feeCollector = _feeCollector;
        owner = msg.sender;
    }

    function registerTrader(string calldata initUsername) external {
        require(!traders[msg.sender].isActive, "CopyTradeRouter: already registered");

        traders[msg.sender] = TraderInfo({
            initUsername: initUsername,
            isActive: true,
            totalTrades: 0,
            totalVolume: 0,
            followerCount: 0,
            registeredAt: block.timestamp
        });
        traderList.push(msg.sender);

        emit TraderRegistered(msg.sender, initUsername);
    }

    function unregisterTrader() external {
        TraderInfo storage info = traders[msg.sender];
        require(info.isActive, "CopyTradeRouter: not active");
        require(info.followerCount == 0, "CopyTradeRouter: has followers");

        info.isActive = false;

        emit TraderUnregistered(msg.sender);
    }

    function followTrader(address trader, address token, uint256 amount) external {
        require(traders[trader].isActive, "CopyTradeRouter: trader not active");
        require(!followPositions[msg.sender][trader].isActive, "CopyTradeRouter: already following");
        require(traders[trader].followerCount < MAX_FOLLOWERS_PER_TRADER, "CopyTradeRouter: max followers reached");
        require(amount > 0, "CopyTradeRouter: zero amount");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        followerBalances[msg.sender][trader][token] += amount;

        followPositions[msg.sender][trader] = FollowPosition({
            isActive: true,
            depositedAt: block.timestamp
        });

        traderFollowers[trader].push(msg.sender);
        traders[trader].followerCount++;

        emit Followed(msg.sender, trader, token, amount);
    }

    function unfollowTrader(address trader) external {
        require(followPositions[msg.sender][trader].isActive, "CopyTradeRouter: not following");

        followPositions[msg.sender][trader].isActive = false;
        traders[trader].followerCount--;

        // Swap-and-pop removal from traderFollowers array
        address[] storage followers = traderFollowers[trader];
        for (uint256 i = 0; i < followers.length; i++) {
            if (followers[i] == msg.sender) {
                followers[i] = followers[followers.length - 1];
                followers.pop();
                break;
            }
        }

        emit Unfollowed(msg.sender, trader);
    }

    function withdrawBalance(address trader, address token) external {
        uint256 balance = followerBalances[msg.sender][trader][token];
        require(balance > 0, "CopyTradeRouter: zero balance");

        followerBalances[msg.sender][trader][token] = 0;
        IERC20(token).transfer(msg.sender, balance);
    }

    function executeTrade(
        uint256 pairId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(traders[msg.sender].isActive, "CopyTradeRouter: not active trader");

        // Determine tokenOut from pair
        (address tokenA, address tokenB) = amm.getPairTokens(pairId);
        address tokenOut;
        if (tokenIn == tokenA) {
            tokenOut = tokenB;
        } else if (tokenIn == tokenB) {
            tokenOut = tokenA;
        } else {
            revert("CopyTradeRouter: invalid tokenIn for pair");
        }

        // (1) Execute leader's own trade
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(amm), amountIn);
        amountOut = amm.swap(pairId, tokenIn, amountIn, minAmountOut);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        emit LeaderTradeExecuted(msg.sender, pairId, tokenIn, amountIn, tokenOut, amountOut);

        // (2) Copy trades for all active followers
        address[] storage followers = traderFollowers[msg.sender];
        for (uint256 i = 0; i < followers.length; i++) {
            address follower = followers[i];

            if (!followPositions[follower][msg.sender].isActive) {
                continue;
            }

            uint256 followerAmount = followerBalances[follower][msg.sender][tokenIn];
            if (followerAmount == 0) {
                continue;
            }

            // Deduct 0.3% copy fee
            uint256 fee = (followerAmount * copyFeeRate) / 10000;
            uint256 swapAmount = followerAmount - fee;

            // Transfer fee to feeCollector
            if (fee > 0) {
                IERC20(tokenIn).transfer(feeCollector, fee);
            }

            // Execute copy trade (minOut = 0 for copies)
            IERC20(tokenIn).approve(address(amm), swapAmount);
            uint256 copyAmountOut = amm.swap(pairId, tokenIn, swapAmount, 0);

            // Update follower balances
            followerBalances[follower][msg.sender][tokenIn] = 0;
            followerBalances[follower][msg.sender][tokenOut] += copyAmountOut;

            emit CopyTradeExecuted(msg.sender, follower, tokenIn, followerAmount, tokenOut, copyAmountOut);
        }

        // (3) Update trader stats
        traders[msg.sender].totalTrades++;
        traders[msg.sender].totalVolume += amountIn;
    }

    // --- View functions ---

    function getTraderCount() external view returns (uint256) {
        return traderList.length;
    }

    function getTraderByIndex(uint256 index) external view returns (address) {
        require(index < traderList.length, "CopyTradeRouter: index out of bounds");
        return traderList[index];
    }

    function getTraderInfo(address trader) external view returns (TraderInfo memory) {
        return traders[trader];
    }

    function getFollowers(address trader) external view returns (address[] memory) {
        return traderFollowers[trader];
    }

    function getFollowerBalance(address follower, address trader, address token) external view returns (uint256) {
        return followerBalances[follower][trader][token];
    }

    function isFollowing(address follower, address trader) external view returns (bool) {
        return followPositions[follower][trader].isActive;
    }
}

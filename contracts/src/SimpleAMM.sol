// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract SimpleAMM {
    struct Pair {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }

    uint256 public pairCount;
    mapping(uint256 => Pair) public pairs;
    mapping(address => mapping(address => uint256)) public getPairId;

    // We use pairCount starting at 1 so that 0 means "no pair"
    uint256 private constant FEE_NUMERATOR = 997;
    uint256 private constant FEE_DENOMINATOR = 1000;

    event PairCreated(uint256 indexed pairId, address tokenA, address tokenB);
    event LiquidityAdded(uint256 indexed pairId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(uint256 indexed pairId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(uint256 indexed pairId, address indexed trader, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    function createPair(address tokenA, address tokenB) external returns (uint256 pairId) {
        require(tokenA != tokenB, "SimpleAMM: identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "SimpleAMM: zero address");
        require(getPairId[tokenA][tokenB] == 0, "SimpleAMM: pair exists");

        pairCount++;
        pairId = pairCount;

        Pair storage pair = pairs[pairId];
        pair.tokenA = tokenA;
        pair.tokenB = tokenB;

        getPairId[tokenA][tokenB] = pairId;
        getPairId[tokenB][tokenA] = pairId;

        emit PairCreated(pairId, tokenA, tokenB);
    }

    function addLiquidity(uint256 pairId, uint256 amountA, uint256 amountB) external returns (uint256 liquidity) {
        require(pairId > 0 && pairId <= pairCount, "SimpleAMM: invalid pair");
        require(amountA > 0 && amountB > 0, "SimpleAMM: zero amount");

        Pair storage pair = pairs[pairId];

        IERC20(pair.tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(pair.tokenB).transferFrom(msg.sender, address(this), amountB);

        if (pair.totalLiquidity == 0) {
            liquidity = _sqrt(amountA * amountB);
            require(liquidity > 0, "SimpleAMM: insufficient initial liquidity");
        } else {
            uint256 liquidityA = (amountA * pair.totalLiquidity) / pair.reserveA;
            uint256 liquidityB = (amountB * pair.totalLiquidity) / pair.reserveB;
            liquidity = _min(liquidityA, liquidityB);
        }

        require(liquidity > 0, "SimpleAMM: insufficient liquidity minted");

        pair.reserveA += amountA;
        pair.reserveB += amountB;
        pair.totalLiquidity += liquidity;
        pair.liquidity[msg.sender] += liquidity;

        emit LiquidityAdded(pairId, msg.sender, amountA, amountB, liquidity);
    }

    function removeLiquidity(uint256 pairId, uint256 liquidity) external returns (uint256 amountA, uint256 amountB) {
        require(pairId > 0 && pairId <= pairCount, "SimpleAMM: invalid pair");
        require(liquidity > 0, "SimpleAMM: zero liquidity");

        Pair storage pair = pairs[pairId];
        require(pair.liquidity[msg.sender] >= liquidity, "SimpleAMM: insufficient liquidity");

        amountA = (liquidity * pair.reserveA) / pair.totalLiquidity;
        amountB = (liquidity * pair.reserveB) / pair.totalLiquidity;
        require(amountA > 0 && amountB > 0, "SimpleAMM: insufficient amounts");

        pair.liquidity[msg.sender] -= liquidity;
        pair.totalLiquidity -= liquidity;
        pair.reserveA -= amountA;
        pair.reserveB -= amountB;

        IERC20(pair.tokenA).transfer(msg.sender, amountA);
        IERC20(pair.tokenB).transfer(msg.sender, amountB);

        emit LiquidityRemoved(pairId, msg.sender, amountA, amountB, liquidity);
    }

    function swap(uint256 pairId, address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut) {
        require(pairId > 0 && pairId <= pairCount, "SimpleAMM: invalid pair");
        require(amountIn > 0, "SimpleAMM: zero input");

        Pair storage pair = pairs[pairId];

        address tokenOut;
        uint256 reserveIn;
        uint256 reserveOut;

        if (tokenIn == pair.tokenA) {
            tokenOut = pair.tokenB;
            reserveIn = pair.reserveA;
            reserveOut = pair.reserveB;
        } else if (tokenIn == pair.tokenB) {
            tokenOut = pair.tokenA;
            reserveIn = pair.reserveB;
            reserveOut = pair.reserveA;
        } else {
            revert("SimpleAMM: invalid tokenIn");
        }

        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= minAmountOut, "SimpleAMM: slippage exceeded");
        require(amountOut > 0, "SimpleAMM: zero output");

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        if (tokenIn == pair.tokenA) {
            pair.reserveA += amountIn;
            pair.reserveB -= amountOut;
        } else {
            pair.reserveB += amountIn;
            pair.reserveA -= amountOut;
        }

        emit Swap(pairId, msg.sender, tokenIn, amountIn, tokenOut, amountOut);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "SimpleAMM: zero input amount");
        require(reserveIn > 0 && reserveOut > 0, "SimpleAMM: insufficient reserves");

        uint256 amountInWithFee = amountIn * FEE_NUMERATOR;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        return numerator / denominator;
    }

    function getReserves(uint256 pairId) external view returns (uint256, uint256) {
        Pair storage pair = pairs[pairId];
        return (pair.reserveA, pair.reserveB);
    }

    function getPairTokens(uint256 pairId) external view returns (address, address) {
        Pair storage pair = pairs[pairId];
        return (pair.tokenA, pair.tokenB);
    }

    function getLiquidity(uint256 pairId, address provider) external view returns (uint256) {
        return pairs[pairId].liquidity[provider];
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}

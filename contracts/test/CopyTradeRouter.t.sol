// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockERC20.sol";
import "../src/SimpleAMM.sol";
import "../src/CopyTradeRouter.sol";

contract CopyTradeRouterTest is Test {
    MockERC20 usdc;
    MockERC20 winit;
    SimpleAMM amm;
    CopyTradeRouter router;

    address leader = makeAddr("leader");
    address follower1 = makeAddr("follower1");
    address follower2 = makeAddr("follower2");
    address feeCollector = makeAddr("feeCollector");

    uint256 pairId;

    function setUp() public {
        usdc = new MockERC20("USDC", "USDC", 6);
        winit = new MockERC20("WINIT", "WINIT", 18);
        amm = new SimpleAMM();
        router = new CopyTradeRouter(address(amm), feeCollector);

        // Create pair and seed liquidity
        pairId = amm.createPair(address(usdc), address(winit));

        usdc.mint(address(this), 100_000e6);
        winit.mint(address(this), 50_000e18);
        usdc.approve(address(amm), 100_000e6);
        winit.approve(address(amm), 50_000e18);
        amm.addLiquidity(pairId, 100_000e6, 50_000e18);

        // Fund participants
        usdc.mint(leader, 10_000e6);
        usdc.mint(follower1, 5_000e6);
        usdc.mint(follower2, 3_000e6);
    }

    function test_registerTrader() public {
        vm.prank(leader);
        router.registerTrader("alice.init");

        CopyTradeRouter.TraderInfo memory info = router.getTraderInfo(leader);
        assertEq(info.initUsername, "alice.init");
        assertTrue(info.isActive);
        assertEq(router.getTraderCount(), 1);
    }

    function test_followTrader() public {
        vm.prank(leader);
        router.registerTrader("alice.init");

        vm.startPrank(follower1);
        usdc.approve(address(router), 1_000e6);
        router.followTrader(leader, address(usdc), 1_000e6);
        vm.stopPrank();

        assertTrue(router.isFollowing(follower1, leader));
        assertEq(router.getFollowerBalance(follower1, leader, address(usdc)), 1_000e6);

        CopyTradeRouter.TraderInfo memory info = router.getTraderInfo(leader);
        assertEq(info.followerCount, 1);
    }

    function test_executeTrade_copiesFollowers() public {
        // Setup: leader registers, follower deposits
        vm.prank(leader);
        router.registerTrader("alice.init");

        vm.startPrank(follower1);
        usdc.approve(address(router), 2_000e6);
        router.followTrader(leader, address(usdc), 2_000e6);
        vm.stopPrank();

        // Leader executes trade: USDC -> WINIT
        vm.startPrank(leader);
        usdc.approve(address(router), 1_000e6);
        router.executeTrade(pairId, address(usdc), 1_000e6, 0);
        vm.stopPrank();

        // Leader should have received WINIT
        assertGt(winit.balanceOf(leader), 0);

        // Follower's USDC should be swapped to WINIT (minus fee)
        assertEq(router.getFollowerBalance(follower1, leader, address(usdc)), 0);
        assertGt(router.getFollowerBalance(follower1, leader, address(winit)), 0);

        // Fee collector should have received fees
        assertGt(usdc.balanceOf(feeCollector), 0);

        // Trader stats updated
        CopyTradeRouter.TraderInfo memory info = router.getTraderInfo(leader);
        assertEq(info.totalTrades, 1);
        assertEq(info.totalVolume, 1_000e6);
    }

    function test_withdrawBalance() public {
        vm.prank(leader);
        router.registerTrader("alice.init");

        vm.startPrank(follower1);
        usdc.approve(address(router), 1_000e6);
        router.followTrader(leader, address(usdc), 1_000e6);
        vm.stopPrank();

        // Leader trades
        vm.startPrank(leader);
        usdc.approve(address(router), 500e6);
        router.executeTrade(pairId, address(usdc), 500e6, 0);
        vm.stopPrank();

        // Follower withdraws WINIT
        uint256 winitBalance = router.getFollowerBalance(follower1, leader, address(winit));
        assertGt(winitBalance, 0);

        vm.prank(follower1);
        router.withdrawBalance(leader, address(winit));

        assertEq(winit.balanceOf(follower1), winitBalance);
        assertEq(router.getFollowerBalance(follower1, leader, address(winit)), 0);
    }

    function test_unfollowTrader() public {
        vm.prank(leader);
        router.registerTrader("alice.init");

        vm.startPrank(follower1);
        usdc.approve(address(router), 1_000e6);
        router.followTrader(leader, address(usdc), 1_000e6);
        router.unfollowTrader(leader);
        vm.stopPrank();

        assertFalse(router.isFollowing(follower1, leader));
        assertEq(router.getTraderInfo(leader).followerCount, 0);
    }

    function test_multipleFollowers() public {
        vm.prank(leader);
        router.registerTrader("alice.init");

        vm.startPrank(follower1);
        usdc.approve(address(router), 2_000e6);
        router.followTrader(leader, address(usdc), 2_000e6);
        vm.stopPrank();

        vm.startPrank(follower2);
        usdc.approve(address(router), 1_000e6);
        router.followTrader(leader, address(usdc), 1_000e6);
        vm.stopPrank();

        assertEq(router.getTraderInfo(leader).followerCount, 2);

        // Leader trades -> both followers get copied
        vm.startPrank(leader);
        usdc.approve(address(router), 500e6);
        router.executeTrade(pairId, address(usdc), 500e6, 0);
        vm.stopPrank();

        assertGt(router.getFollowerBalance(follower1, leader, address(winit)), 0);
        assertGt(router.getFollowerBalance(follower2, leader, address(winit)), 0);

        // Follower1 got more WINIT (deposited more)
        assertGt(
            router.getFollowerBalance(follower1, leader, address(winit)),
            router.getFollowerBalance(follower2, leader, address(winit))
        );
    }
}

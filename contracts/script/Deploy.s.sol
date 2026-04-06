// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";
import "../src/SimpleAMM.sol";
import "../src/CopyTradeRouter.sol";

contract DeployScript is Script {
    function run() external {
        address deployer = msg.sender;

        vm.startBroadcast();

        // 1. Deploy tokens
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6);
        MockERC20 winit = new MockERC20("Wrapped INIT", "WINIT", 18);
        MockERC20 weth = new MockERC20("Wrapped ETH", "WETH", 18);

        // 2. Deploy AMM
        SimpleAMM amm = new SimpleAMM();

        // 3. Deploy CopyTradeRouter (deployer as feeCollector)
        CopyTradeRouter router = new CopyTradeRouter(address(amm), deployer);

        // 4. Create pairs
        uint256 usdcWinitPairId = amm.createPair(address(usdc), address(winit));
        uint256 wethWinitPairId = amm.createPair(address(weth), address(winit));

        // 5. Mint 1M tokens to deployer
        usdc.mint(deployer, 1_000_000 * 10 ** 6);
        winit.mint(deployer, 1_000_000 * 10 ** 18);
        weth.mint(deployer, 1_000_000 * 10 ** 18);

        // 6. Approve AMM and add initial liquidity
        // USDC/WINIT: 100k USDC + 50k WINIT
        usdc.approve(address(amm), 100_000 * 10 ** 6);
        winit.approve(address(amm), 50_000 * 10 ** 18);
        amm.addLiquidity(usdcWinitPairId, 100_000 * 10 ** 6, 50_000 * 10 ** 18);

        // WETH/WINIT: 50 WETH + 100k WINIT
        weth.approve(address(amm), 50 * 10 ** 18);
        winit.approve(address(amm), 100_000 * 10 ** 18);
        amm.addLiquidity(wethWinitPairId, 50 * 10 ** 18, 100_000 * 10 ** 18);

        vm.stopBroadcast();

        // 7. Log deployed addresses
        console.log("=== Deployed Addresses ===");
        console.log("USDC:            ", address(usdc));
        console.log("WINIT:           ", address(winit));
        console.log("WETH:            ", address(weth));
        console.log("SimpleAMM:       ", address(amm));
        console.log("CopyTradeRouter: ", address(router));
        console.log("USDC/WINIT pair: ", usdcWinitPairId);
        console.log("WETH/WINIT pair: ", wethWinitPairId);
    }
}

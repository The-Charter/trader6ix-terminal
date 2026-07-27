// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Trader6ixEurcUsdcPool} from "../src/Trader6ixEurcUsdcPool.sol";

/// @notice Deploys Trader6ixEurcUsdcPool to Arc Testnet.
/// Run with (see contracts/README.md for full setup):
///
///   forge script script/DeployPool.s.sol:DeployPool \
///     --rpc-url $ARC_TESTNET_RPC_URL \
///     --private-key $PRIVATE_KEY \
///     --broadcast
contract DeployPool is Script {
    // Arc Testnet addresses — see https://docs.arc.io/arc/references/contract-addresses
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant EURC = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;

    function run() external returns (Trader6ixEurcUsdcPool pool) {
        vm.startBroadcast();
        pool = new Trader6ixEurcUsdcPool(USDC, EURC);
        vm.stopBroadcast();

        console.log("Trader6ixEurcUsdcPool deployed at:", address(pool));
    }
}

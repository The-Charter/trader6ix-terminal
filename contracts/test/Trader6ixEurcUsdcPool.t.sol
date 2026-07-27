// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Trader6ixEurcUsdcPool} from "../src/Trader6ixEurcUsdcPool.sol";

/// @notice Minimal mock ERC-20 — just enough to exercise the pool's logic in
/// local tests without touching Arc Testnet at all.
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract Trader6ixEurcUsdcPoolTest is Test {
    Trader6ixEurcUsdcPool pool;
    MockERC20 usdc;
    MockERC20 eurc;
    address lp = address(0x1);
    address trader = address(0x2);

    function setUp() public {
        usdc = new MockERC20();
        eurc = new MockERC20();
        pool = new Trader6ixEurcUsdcPool(address(usdc), address(eurc));

        usdc.mint(lp, 1_000_000e6);
        eurc.mint(lp, 1_000_000e6);
        usdc.mint(trader, 1_000e6);
    }

    function testAddLiquidity() public {
        vm.startPrank(lp);
        usdc.approve(address(pool), 100_000e6);
        eurc.approve(address(pool), 92_000e6); // roughly EUR/USD ~1.087 at time of writing
        pool.addLiquidity(100_000e6, 92_000e6);
        vm.stopPrank();

        (uint256 rUsdc, uint256 rEurc) = pool.getReserves();
        assertEq(rUsdc, 100_000e6);
        assertEq(rEurc, 92_000e6);
        assertEq(pool.lpShares(lp), 100_000e6);
    }

    function testSwapUsdcForEurc() public {
        vm.startPrank(lp);
        usdc.approve(address(pool), 100_000e6);
        eurc.approve(address(pool), 92_000e6);
        pool.addLiquidity(100_000e6, 92_000e6);
        vm.stopPrank();

        vm.startPrank(trader);
        usdc.approve(address(pool), 1_000e6);
        uint256 eurcOut = pool.swapUsdcForEurc(1_000e6, 0);
        vm.stopPrank();

        assertGt(eurcOut, 0);
        assertEq(eurc.balanceOf(trader), eurcOut);
    }

    function testRemoveLiquidity() public {
        vm.startPrank(lp);
        usdc.approve(address(pool), 100_000e6);
        eurc.approve(address(pool), 92_000e6);
        pool.addLiquidity(100_000e6, 92_000e6);

        (uint256 usdcOut, uint256 eurcOut) = pool.removeLiquidity(50_000e6);
        vm.stopPrank();

        assertEq(usdcOut, 50_000e6);
        assertEq(eurcOut, 46_000e6);
    }
}

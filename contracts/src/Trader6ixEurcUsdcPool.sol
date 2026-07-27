// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-20 interface — no external dependency needed to build this.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/// @title Trader6ixEurcUsdcPool
/// @notice A minimal constant-product (x*y=k) AMM for a single EURC/USDC pair on
/// Arc Testnet. This is intentionally simple — one pool, one pair, internal LP
/// accounting instead of a full ERC-20 LP token — so it's easy to read, deploy,
/// and verify. It is NOT audited and is for testnet use only.
///
/// Real reserves live in this contract's own token balances; there is no owner,
/// no pause switch, no upgradability — swaps and liquidity math are the only
/// state-changing paths.
contract Trader6ixEurcUsdcPool {
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;

    uint256 public reserveUsdc;
    uint256 public reserveEurc;

    uint256 public totalLpShares;
    mapping(address => uint256) public lpShares;

    /// @dev 30 basis points, same default as most constant-product AMMs.
    uint256 public constant FEE_BPS = 30;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    event LiquidityAdded(address indexed provider, uint256 usdcIn, uint256 eurcIn, uint256 sharesMinted);
    event LiquidityRemoved(address indexed provider, uint256 usdcOut, uint256 eurcOut, uint256 sharesBurned);
    event Swap(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    error InsufficientOutput();
    error InsufficientLiquidity();
    error InsufficientShares();
    error InvalidToken();
    error ZeroAmount();

    constructor(address usdcAddress, address eurcAddress) {
        usdc = IERC20(usdcAddress);
        eurc = IERC20(eurcAddress);
    }

    /// @notice Deposit both sides of the pair. First depositor sets the initial
    /// price; every deposit after that must match the pool's current ratio
    /// (within integer rounding) or it will mint disproportionate shares.
    function addLiquidity(uint256 usdcAmount, uint256 eurcAmount) external returns (uint256 sharesMinted) {
        if (usdcAmount == 0 || eurcAmount == 0) revert ZeroAmount();

        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transferFrom failed");
        require(eurc.transferFrom(msg.sender, address(this), eurcAmount), "EURC transferFrom failed");

        if (totalLpShares == 0) {
            // Bootstrap: shares equal the USDC amount deposited (6 decimals),
            // giving a human-readable initial share count.
            sharesMinted = usdcAmount;
        } else {
            uint256 shareFromUsdc = (usdcAmount * totalLpShares) / reserveUsdc;
            uint256 shareFromEurc = (eurcAmount * totalLpShares) / reserveEurc;
            sharesMinted = shareFromUsdc < shareFromEurc ? shareFromUsdc : shareFromEurc;
        }

        lpShares[msg.sender] += sharesMinted;
        totalLpShares += sharesMinted;
        reserveUsdc += usdcAmount;
        reserveEurc += eurcAmount;

        emit LiquidityAdded(msg.sender, usdcAmount, eurcAmount, sharesMinted);
    }

    /// @notice Burn LP shares for a proportional slice of both reserves.
    function removeLiquidity(uint256 shares) external returns (uint256 usdcOut, uint256 eurcOut) {
        if (shares == 0) revert ZeroAmount();
        if (lpShares[msg.sender] < shares) revert InsufficientShares();

        usdcOut = (shares * reserveUsdc) / totalLpShares;
        eurcOut = (shares * reserveEurc) / totalLpShares;

        lpShares[msg.sender] -= shares;
        totalLpShares -= shares;
        reserveUsdc -= usdcOut;
        reserveEurc -= eurcOut;

        require(usdc.transfer(msg.sender, usdcOut), "USDC transfer failed");
        require(eurc.transfer(msg.sender, eurcOut), "EURC transfer failed");

        emit LiquidityRemoved(msg.sender, usdcOut, eurcOut, shares);
    }

    /// @notice Swap USDC -> EURC.
    function swapUsdcForEurc(uint256 usdcIn, uint256 minEurcOut) external returns (uint256 eurcOut) {
        if (usdcIn == 0) revert ZeroAmount();
        if (reserveUsdc == 0 || reserveEurc == 0) revert InsufficientLiquidity();

        eurcOut = getAmountOut(usdcIn, reserveUsdc, reserveEurc);
        if (eurcOut < minEurcOut) revert InsufficientOutput();

        require(usdc.transferFrom(msg.sender, address(this), usdcIn), "USDC transferFrom failed");
        require(eurc.transfer(msg.sender, eurcOut), "EURC transfer failed");

        reserveUsdc += usdcIn;
        reserveEurc -= eurcOut;

        emit Swap(msg.sender, address(usdc), usdcIn, eurcOut);
    }

    /// @notice Swap EURC -> USDC.
    function swapEurcForUsdc(uint256 eurcIn, uint256 minUsdcOut) external returns (uint256 usdcOut) {
        if (eurcIn == 0) revert ZeroAmount();
        if (reserveUsdc == 0 || reserveEurc == 0) revert InsufficientLiquidity();

        usdcOut = getAmountOut(eurcIn, reserveEurc, reserveUsdc);
        if (usdcOut < minUsdcOut) revert InsufficientOutput();

        require(eurc.transferFrom(msg.sender, address(this), eurcIn), "EURC transferFrom failed");
        require(usdc.transfer(msg.sender, usdcOut), "USDC transfer failed");

        reserveEurc += eurcIn;
        reserveUsdc -= usdcOut;

        emit Swap(msg.sender, address(eurc), eurcIn, usdcOut);
    }

    /// @notice Constant-product quote with the pool fee applied, matching the
    /// standard Uniswap V2 formula: amountOut = (amountIn * (1-fee) * reserveOut)
    /// / (reserveIn + amountIn * (1-fee)).
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        uint256 amountInWithFee = amountIn * (BPS_DENOMINATOR - FEE_BPS);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * BPS_DENOMINATOR) + amountInWithFee;
        return numerator / denominator;
    }

    function getReserves() external view returns (uint256 usdcReserve, uint256 eurcReserve) {
        return (reserveUsdc, reserveEurc);
    }
}

/**
 * Minimal Curve StableSwap-NG ABI — the current pool implementation Curve
 * deploys on new chains, using uint256 token indices (older Curve pools used
 * int128; if this pool reverts on these calls, it may be a legacy pool using
 * int128 indices instead — see the fallback note in curve-adapter.ts).
 */
export const CURVE_POOL_ABI = [
  "function coins(uint256 i) view returns (address)",
  "function get_dy(uint256 i, uint256 j, uint256 dx) view returns (uint256)",
  "function exchange(uint256 i, uint256 j, uint256 dx, uint256 min_dy) returns (uint256)",
];

export const ERC20_MIN_ABI = [
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

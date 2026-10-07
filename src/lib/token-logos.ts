import type { AssetSymbol } from "@/lib/markets";

/**
 * CoinGecko's public asset CDN. These paths are CoinGecko's official hosted logos
 * for each asset, but CDN ids can occasionally rotate — the <TokenLogo> component
 * below falls back to a lettered avatar if an image fails to load, so a stale path
 * never renders as a broken image.
 */
export const TOKEN_LOGOS: Record<AssetSymbol, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
  LTC: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  EURC: "https://assets.coingecko.com/coins/images/26045/large/euro-coin.png",
};

const FALLBACK_COLORS: Record<AssetSymbol, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#14F195",
  DOGE: "#C2A633",
  LTC: "#345D9D",
  USDC: "#2775CA",
  EURC: "#2775CA",
};

export { FALLBACK_COLORS };

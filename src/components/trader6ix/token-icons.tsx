"use client";

// Crypto token logos vendored from https://github.com/spothq/cryptocurrency-icons
// (CC0-1.0). SVGs live in public/crypto-icons/ so they stay portable and
// work without hotlinking GitHub at runtime. ARB has no upstream icon, so it
// falls back to generic.svg.

const KNOWN = new Set(["btc", "eth", "sol", "xrp", "usdc", "usdt", "matic"]);

export function tokenIconUrl(symbol: string): string {
  const sym = symbol.trim().toLowerCase();
  return `/crypto-icons/${KNOWN.has(sym) ? sym : "generic"}.svg`;
}

export function TokenIcon({
  symbol,
  name,
  className = "",
}: {
  symbol: string;
  name?: string;
  className?: string;
}) {
  const label = name ?? symbol.toUpperCase();
  return (
    <img
      src={tokenIconUrl(symbol)}
      alt={`${label} logo`}
      loading="lazy"
      width={32}
      height={32}
      className={className ? `token-icon ${className}` : "token-icon"}
      onError={(e) => {
        const el = e.currentTarget;
        if (!el.src.endsWith("/generic.svg")) el.src = "/crypto-icons/generic.svg";
      }}
    />
  );
}

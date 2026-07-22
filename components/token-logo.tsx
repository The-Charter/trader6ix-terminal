"use client";

import { useState } from "react";
import type { AssetSymbol } from "@/lib/markets";
import { TOKEN_LOGOS, FALLBACK_COLORS } from "@/lib/token-logos";

export function TokenLogo({
  symbol,
  size = 24,
  className = "",
}: {
  symbol: AssetSymbol;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = TOKEN_LOGOS[symbol];

  if (failed || !src) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full font-mono text-[0.6em] font-bold text-white ${className}`}
        style={{ width: size, height: size, backgroundColor: FALLBACK_COLORS[symbol] }}
      >
        {symbol.slice(0, 1)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

export function MarketLogos({
  base,
  quote,
  size = 22,
}: {
  base: AssetSymbol;
  quote: AssetSymbol;
  size?: number;
}) {
  return (
    <span className="relative inline-flex" style={{ width: size * 1.5, height: size }}>
      <TokenLogo symbol={base} size={size} className="absolute left-0 z-10 ring-2 ring-zinc-950" />
      <TokenLogo symbol={quote} size={size} className="absolute left-[40%] ring-2 ring-zinc-950" />
    </span>
  );
}

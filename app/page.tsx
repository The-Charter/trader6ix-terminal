"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";

const FAUCET_URL = process.env.NEXT_PUBLIC_FAUCET_URL ?? "https://faucet.circle.com";

/** Deterministic-looking candlestick silhouette used as a background watermark. */
function CandlestickWatermark() {
  const bars = [40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50, 75, 40, 95, 65];
  return (
    <svg
      viewBox="0 0 800 300"
      className="absolute inset-0 h-full w-full opacity-[0.06]"
      preserveAspectRatio="none"
      aria-hidden
    >
      {bars.map((h, i) => {
        const x = i * 50 + 10;
        const wickH = h + 30;
        return (
          <g key={i}>
            <line x1={x + 10} y1={150 - wickH / 2} x2={x + 10} y2={150 + wickH / 2} stroke="currentColor" strokeWidth={2} />
            <rect x={x} y={150 - h / 2} width={20} height={h} fill="currentColor" />
          </g>
        );
      })}
    </svg>
  );
}

/** Orderbook ladder silhouette used as a background watermark. */
function OrderbookWatermark() {
  const rows = Array.from({ length: 14 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 h-full w-full opacity-[0.06]"
      preserveAspectRatio="none"
      aria-hidden
    >
      {rows.map((i) => {
        const w = 60 + ((i * 37) % 220);
        return <rect key={`bid-${i}`} x={0} y={i * 21} width={w} height={16} fill="currentColor" />;
      })}
      {rows.map((i) => {
        const w = 60 + ((i * 53) % 220);
        return <rect key={`ask-${i}`} x={400 - w} y={i * 21} width={w} height={16} fill="currentColor" />;
      })}
    </svg>
  );
}

export default function LandingPage() {
  const { login, authenticated, ready } = usePrivy();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-2 text-cyan-400">
        <CandlestickWatermark />
        <OrderbookWatermark />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 text-center">
        <span className="mb-4 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-mono uppercase tracking-wide text-amber-300">
          Arc Testnet — no real funds, no real value
        </span>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Charter</h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-400">
          Spot and perpetuals trading on Arc, powered by Hibachi&rsquo;s orderbook. Connect a wallet,
          grab testnet USDC, start trading.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={login}
            disabled={!ready || authenticated}
            className="rounded-lg bg-cyan-400 px-6 py-3 font-medium text-zinc-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {authenticated ? "Wallet Connected" : "Connect Wallet"}
          </button>

          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-200 transition hover:border-zinc-500"
          >
            Get Testnet USDC ↗
          </a>
        </div>

        <div className="mt-10 flex gap-3">
          <Link
            href="/spot"
            className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-600"
          >
            Trade Spot →
          </Link>
          <Link
            href="/perps"
            className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-600"
          >
            Trade Perps →
          </Link>
        </div>
      </div>
    </main>
  );
}

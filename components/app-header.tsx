"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletStatus } from "@/components/wallet-status";

const FAUCET_URL = process.env.NEXT_PUBLIC_FAUCET_URL ?? "https://faucet.circle.com";

export function AppHeader() {
  const pathname = usePathname();
  const nav = [
    { href: "/spot", label: "Spot" },
    { href: "/perps", label: "Perps" },
  ];

  return (
    <header className="flex items-center justify-between border-b border-border px-3 py-3 sm:px-4">
      <div className="flex items-center gap-3 sm:gap-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Trader6ix" className="h-8 w-auto rounded" />
        </Link>
        <nav className="flex gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2 py-1.5 text-sm font-medium sm:px-3 ${
                pathname?.startsWith(item.href) ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <span className="hidden rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-warn sm:inline-block">
          Testnet
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-2 py-2 text-xs text-ink-2 hover:border-ink-2 sm:px-3 sm:text-sm"
        >
          <span className="sm:hidden">Faucet</span>
          <span className="hidden sm:inline">Faucet ↗</span>
        </a>
        <WalletStatus />
      </div>
    </header>
  );
}

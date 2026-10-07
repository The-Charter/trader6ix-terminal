"use client";

import { usePrivy } from "@privy-io/react-auth";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletStatus() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const address = user?.wallet?.address;

  if (!ready) {
    return <div className="h-9 w-32 animate-pulse rounded-md bg-surface-2" />;
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-zinc-950 hover:opacity-90"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 text-sm font-mono text-ink hover:border-ink-2"
      title="Click to disconnect"
    >
      <span className="h-2 w-2 rounded-full bg-bull" />
      {address ? truncate(address) : "Connected"}
    </button>
  );
}

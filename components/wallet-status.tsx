"use client";

import { usePrivy } from "@privy-io/react-auth";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletStatus() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const address = user?.wallet?.address;

  if (!ready) {
    return <div className="h-9 w-32 animate-pulse rounded-md bg-zinc-800" />;
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-cyan-300"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-200 hover:border-zinc-600"
      title="Click to disconnect"
    >
      <span className="h-2 w-2 rounded-full bg-bull" />
      {address ? truncate(address) : "Connected"}
    </button>
  );
}

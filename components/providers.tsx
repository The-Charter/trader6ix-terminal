"use client";

import { PrivyProvider } from "@privy-io/react-auth";

const ARC_TESTNET = {
  id: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002),
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app",
    },
  },
  testnet: true,
} as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // Fails loudly in dev rather than silently rendering a broken connect button.
    console.warn(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set — wallet connection will not work until it is."
    );
  }

  return (
    <PrivyProvider
      appId={appId ?? ""}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: { theme: "dark", accentColor: "#22D3EE" },
        defaultChain: ARC_TESTNET,
        supportedChains: [ARC_TESTNET],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

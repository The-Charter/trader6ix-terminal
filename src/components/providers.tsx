"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PrivySessionSync } from "@/components/trader6ix/privy-session-sync";
import { PRIVY_APP_ID } from "@/lib/privy-app";
import {
  ARC_CHAIN_ID,
  ARC_CHAIN_NAME,
  ARC_EXPLORER_URL,
  ARC_NETWORK_SLUG,
  ARC_RPC_URL,
  IS_ARC_MAINNET,
} from "@/lib/arc-network";

/**
 * Chain descriptor handed to Privy and to wallet_addEthereumChain. Derived from
 * the env so switching networks never leaves a stale chain in the auth modal.
 *
 * USDC is Arc's native gas token; native balances are 18-decimal wei even
 * though the USDC ERC-20 interface reports 6 (see the token registry).
 */
const ARC_CHAIN = {
  id: ARC_CHAIN_ID,
  name: ARC_CHAIN_NAME,
  network: ARC_NETWORK_SLUG,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: ARC_EXPLORER_URL },
  },
  testnet: !IS_ARC_MAINNET,
} as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = PRIVY_APP_ID;

  if (!appId) {
    // Render without Privy (rather than crashing prerender) when the app ID
    // is missing; wallet connection stays disabled until it is configured.
    if (typeof window !== "undefined") {
      console.warn(
        "NEXT_PUBLIC_PRIVY_APP_ID is not set — wallet connection will not work until it is."
      );
    }
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: { theme: "dark", accentColor: "#22D3EE" },
        defaultChain: ARC_CHAIN,
        supportedChains: [ARC_CHAIN],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      <PrivySessionSync />
      {children}
    </PrivyProvider>
  );
}

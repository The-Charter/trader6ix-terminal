"use client";

import type { MouseEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useConnectWallet } from "@/components/trader6ix/privy-auth";
import { AUTH_REDIRECT_PATH } from "@/components/trader6ix/session";

/**
 * A "Get Started" / "Sign Up" button that opens the Privy wallet modal in place.
 * Signed-in visitors go straight to `redirectTo` (Spot by default).
 */
export function ConnectWalletButton({
  redirectTo = AUTH_REDIRECT_PATH,
  onClick,
  ...props
}: ButtonProps & { redirectTo?: string }) {
  const connect = useConnectWallet(redirectTo);
  return (
    <Button
      type="button"
      {...props}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        connect();
      }}
    />
  );
}

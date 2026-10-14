import { NextResponse } from "next/server";
import { formatUnits } from "ethers";
import { withApi } from "@/server/http/with-api";
import { requireOwnedWallet } from "@/server/auth/ownership";
import { badRequest } from "@/server/http/errors";
import { getTokenTransfers, type TokenTransfer } from "@/server/arc-rpc/client";
import { isTrustedArcToken } from "@/lib/arc-tokens";
import type { IndexedTransaction } from "@/adapters/data-adapter";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function amount(transfer: TokenTransfer): string {
  return Number(formatUnits(transfer.rawValue, transfer.decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

/**
 * Activity feed for the app-bar bell and the portfolio timeline.
 *
 * Rows are grouped per transaction: a transaction that both sends and receives
 * a *different* trusted token is a swap (whichever venue routed it — Tower,
 * Uniswap, Kyber…), and is reported as one line rather than one line per leg.
 */
export const GET = withApi(
  async (req, ctx) => {
    const address = req.nextUrl.searchParams.get("address") ?? "";
    if (!ADDRESS_PATTERN.test(address)) {
      throw badRequest("address query param must be a valid 0x address.");
    }
    await requireOwnedWallet(ctx.user, address);

    const transfers = (await getTokenTransfers(address)).filter((transfer) =>
      isTrustedArcToken(transfer.tokenAddress)
    );
    const wallet = address.toLowerCase();

    const grouped = new Map<string, TokenTransfer[]>();
    for (const transfer of transfers) {
      const group = grouped.get(transfer.txHash) ?? [];
      group.push(transfer);
      grouped.set(transfer.txHash, group);
    }

    const rows: IndexedTransaction[] = [];
    for (const [hash, group] of grouped) {
      const outgoing = group.filter((transfer) => transfer.from.toLowerCase() === wallet);
      const incoming = group.filter((transfer) => transfer.to.toLowerCase() === wallet);
      const symbols = new Set(group.map((transfer) => transfer.tokenSymbol));
      const timestamp = Math.floor(new Date(group[0].timestamp).getTime() / 1000);

      const sold = outgoing.find((out) => incoming.some((inc) => inc.tokenSymbol !== out.tokenSymbol));
      const bought = sold ? incoming.find((inc) => inc.tokenSymbol !== sold.tokenSymbol) : undefined;

      if (sold && bought && symbols.size > 1) {
        rows.push({
          hash: `${hash}-swap`,
          timestamp,
          type: "swap",
          summary: `Swapped ${amount(sold)} ${sold.tokenSymbol} → ${amount(bought)} ${bought.tokenSymbol}`,
        });
        continue;
      }

      for (const transfer of group) {
        const incomingLeg = transfer.to.toLowerCase() === wallet;
        rows.push({
          hash: `${hash}-${transfer.logIndex}`,
          timestamp,
          type: "transfer",
          summary: `${incomingLeg ? "Received" : "Sent"} ${amount(transfer)} ${transfer.tokenSymbol}`,
        });
      }
    }

    rows.sort((a, b) => b.timestamp - a.timestamp);
    return NextResponse.json(rows);
  },
  { auth: true, rateLimit: { limit: 60 } }
);

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;

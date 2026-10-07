import { NextRequest, NextResponse } from "next/server";
import { formatUnits } from "ethers";
import { getTokenTransfers } from "@/server/arc-explorer/client";
import { isTrustedArcToken } from "@/lib/arc-tokens";
import type { IndexedTransaction } from "@/adapters/data-adapter";

export const dynamic = "force-dynamic";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/** Known swap entrypoints, keyed by 4-byte method selector. */
const SWAP_METHODS = new Set(["0xcd6267d5"]); // TowerSwapExecutor.executeSwap

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !ADDRESS_PATTERN.test(address)) {
    return NextResponse.json({ error: "address query param must be a valid 0x address" }, { status: 400 });
  }

  try {
    const transfers = (await getTokenTransfers(address)).filter((transfer) => isTrustedArcToken(transfer.tokenAddress));
    const wallet = address.toLowerCase();

    const transactions: IndexedTransaction[] = transfers.map((transfer) => {
      const incoming = transfer.to.toLowerCase() === wallet;
      const amount = formatUnits(transfer.rawValue, transfer.decimals);
      const type = transfer.method && SWAP_METHODS.has(transfer.method) ? "swap" : "transfer";
      const direction = incoming ? "Received" : "Sent";
      return {
        hash: `${transfer.txHash}-${transfer.logIndex}`,
        timestamp: Math.floor(new Date(transfer.timestamp).getTime() / 1000),
        type,
        summary: `${direction} ${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${transfer.tokenSymbol}`,
      };
    });

    return NextResponse.json(transactions);
  } catch (err) {
    console.error("Activity request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}

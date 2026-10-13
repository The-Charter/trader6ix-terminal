import { NextResponse } from "next/server";
import { ARC_CHAIN_ID, ARC_CHAIN_NAME } from "@/lib/arc-network";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

/**
 * Unauthenticated liveness probe for the hosting platform and uptime monitors.
 *
 * Deliberately shallow. It reports that the process is serving and which chain
 * it is configured for, but never touches the database or the RPC: a health
 * check that fails when an upstream is slow makes the platform restart a
 * perfectly healthy instance, and turns a Tower or RPC blip into an outage of
 * our own. Use it for liveness only, not readiness.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "trader6ix",
      chain: ARC_CHAIN_NAME,
      chainId: ARC_CHAIN_ID,
      time: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;

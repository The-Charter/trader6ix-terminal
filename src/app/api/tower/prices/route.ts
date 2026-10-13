import { NextResponse } from "next/server";
import { getTowerPrices } from "@/server/tower/client";
import { toTowerErrorResponse } from "@/server/tower/errors";
import { corsPreflight } from "@/server/http/cors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getTowerPrices();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Tower prices request failed:", err instanceof Error ? err.message : err);
    const { status, body } = toTowerErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;

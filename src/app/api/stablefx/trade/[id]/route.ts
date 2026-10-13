export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTrade } from "@/server/stablefx/client";
import { corsPreflight } from "@/server/http/cors";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getTrade(params.id);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTowerQuote } from "@/lib/tower/client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const data = await getTowerQuote(body);
    return NextResponse.json(data);
  } catch (err) {
    // Log server-side only, and never include the key/Authorization header.
    console.error("Tower quote request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}

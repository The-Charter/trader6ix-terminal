export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createTrade } from "@/lib/stablefx/client";

export async function POST(req: NextRequest) {
  const { quoteId } = await req.json();
  try {
    const data = await createTrade(quoteId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}

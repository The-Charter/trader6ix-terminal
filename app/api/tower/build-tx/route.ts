export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { buildTowerSwapTx } from "@/lib/tower/client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const data = await buildTowerSwapTx(body);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Tower build-tx request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}

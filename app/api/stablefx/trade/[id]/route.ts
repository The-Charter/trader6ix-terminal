export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTrade } from "@/lib/stablefx/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getTrade(params.id);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getTowerDexes } from "@/server/tower/client";
import { toTowerErrorResponse } from "@/server/tower/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getTowerDexes();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Tower dexes request failed:", err instanceof Error ? err.message : err);
    const { status, body } = toTowerErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

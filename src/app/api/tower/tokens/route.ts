import { NextResponse } from "next/server";
import { getTowerTokens } from "@/server/tower/client";
import { toTowerErrorResponse } from "@/server/tower/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getTowerTokens();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Tower tokens request failed:", err instanceof Error ? err.message : err);
    const { status, body } = toTowerErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

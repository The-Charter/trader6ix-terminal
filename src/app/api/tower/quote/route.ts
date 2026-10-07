import { NextRequest, NextResponse } from "next/server";
import { getTowerQuote } from "@/server/tower/client";
import { parseQuoteRequest } from "@/server/tower/validation";
import { toTowerErrorResponse } from "@/server/tower/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const data = await getTowerQuote(parseQuoteRequest(body));
    return NextResponse.json(data);
  } catch (err) {
    // Log server-side only; never log the API key or Authorization header.
    console.error("Tower quote request failed:", err instanceof Error ? err.message : err);
    const { status, body: errorBody } = toTowerErrorResponse(err);
    return NextResponse.json(errorBody, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getOrderbook } from "@/lib/hibachi/client";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol query param is required" }, { status: 400 });
  }
  try {
    const data = await getOrderbook(symbol);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import { getExchangeInfo } from "@/lib/hibachi/client";

export async function GET() {
  try {
    const data = await getExchangeInfo();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}

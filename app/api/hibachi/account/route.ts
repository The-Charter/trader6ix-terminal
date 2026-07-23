import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getAccountInfo, getPendingOrders } from "@/lib/hibachi/client";

export async function GET() {
  try {
    const [account, orders] = await Promise.all([getAccountInfo(), getPendingOrders()]);
    return NextResponse.json({ account, orders });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}

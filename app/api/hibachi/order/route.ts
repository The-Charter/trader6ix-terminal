import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { placeOrder, cancelOrder } from "@/lib/hibachi/client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const result = await placeOrder({
      symbol: body.symbol,
      contractId: body.contractId,
      side: body.side,
      quantity: BigInt(body.quantity),
      price: body.price !== undefined ? BigInt(body.price) : undefined,
      maxFeesPercent: body.maxFeesPercent,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId query param is required" }, { status: 400 });
  }
  try {
    const result = await cancelOrder(orderId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}

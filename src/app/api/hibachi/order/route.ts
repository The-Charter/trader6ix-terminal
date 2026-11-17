import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { placeOrder, cancelOrder } from "@/server/hibachi/client";
import { corsPreflight } from "@/server/http/cors";
import { withApi } from "@/server/http/with-api";

/**
 * Orders go out under the server's single Hibachi key, i.e. on OUR account, so
 * these routes are admin-only until each user trades with their own key.
 */
export const POST = withApi(
  async (req: NextRequest) => {
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
  },
  { roles: ["admin"], rateLimit: { limit: 30 } }
);

export const DELETE = withApi(
  async (req: NextRequest) => {
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
  },
  { roles: ["admin"], rateLimit: { limit: 30 } }
);

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;

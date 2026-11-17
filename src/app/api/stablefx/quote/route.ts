export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createQuote } from "@/server/stablefx/client";
import { corsPreflight } from "@/server/http/cors";
import { withApi } from "@/server/http/with-api";

/** Runs on our Circle StableFX key, so admin-only until StableFX goes live per user. */
export const POST = withApi(
  async (req: NextRequest) => {
    const body = await req.json();
    try {
      const data = await createQuote(body);
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
    }
  },
  { roles: ["admin"], rateLimit: { limit: 30 } }
);

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;

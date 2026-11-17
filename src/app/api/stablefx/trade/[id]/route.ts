export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTrade } from "@/server/stablefx/client";
import { corsPreflight } from "@/server/http/cors";
import { withApi } from "@/server/http/with-api";

/** Runs on our Circle StableFX key, so admin-only (see ../../quote/route.ts). */
export const GET = withApi<{ id: string }>(
  async (_req: NextRequest, _ctx, params) => {
    try {
      const data = await getTrade(params.id);
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
    }
  },
  { roles: ["admin"] }
);

/** Answers the CORS preflight; Next's own OPTIONS answer carries no CORS headers. */
export const OPTIONS = corsPreflight;

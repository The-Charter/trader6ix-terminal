import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, emptyOk } from "@/server/http/responses";
import { parseJson } from "@/server/http/validation";
import { ApiError } from "@/server/http/errors";
import type { RequestContext } from "@/server/http/context";
import * as service from "./service";

const createSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(15)
    .regex(/^[A-Za-z0-9]+$/, "symbol must be alphanumeric"),
});

function requireUser(ctx: RequestContext) {
  if (!ctx.user) throw new ApiError("UNAUTHORIZED", "Authentication required.");
  return ctx.user;
}

export async function listHandler(_req: NextRequest, ctx: RequestContext) {
  return jsonOk(await service.list(requireUser(ctx).id));
}

export async function createHandler(req: NextRequest, ctx: RequestContext) {
  const { symbol } = await parseJson(req, createSchema);
  return jsonOk(await service.add(requireUser(ctx).id, symbol), 201);
}

export async function getHandler(_req: NextRequest, ctx: RequestContext, params: { id: string }) {
  return jsonOk(await service.get(params.id, requireUser(ctx).id));
}

export async function deleteHandler(_req: NextRequest, ctx: RequestContext, params: { id: string }) {
  await service.remove(params.id, requireUser(ctx).id);
  return emptyOk();
}

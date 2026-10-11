import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk } from "@/server/http/responses";
import { parseJson } from "@/server/http/validation";
import type { RequestContext } from "@/server/http/context";
import * as service from "./service";

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12, "Password must be at least 12 characters.").max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function registerHandler(req: NextRequest, _ctx: RequestContext) {
  const { email, password } = await parseJson(req, registerSchema);
  return jsonOk(await service.register(email, password), 201);
}

export async function loginHandler(req: NextRequest, _ctx: RequestContext) {
  const { email, password } = await parseJson(req, loginSchema);
  return jsonOk(await service.login(email, password));
}

export async function listUsersHandler(_req: NextRequest, _ctx: RequestContext) {
  return jsonOk(await service.listUsers());
}

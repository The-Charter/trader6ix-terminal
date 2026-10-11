import type { NextRequest } from "next/server";
import type { z } from "zod";
import { ApiError } from "./errors";

/**
 * Reads and validates a JSON body against a Zod schema. On failure it raises a
 * safe ApiError (400) carrying flattened field errors — never the raw body.
 */
export async function parseJson<T>(req: NextRequest, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("BAD_REQUEST", "Request body must be valid JSON.");
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError("VALIDATION_FAILED", "Request validation failed.", result.error.flatten());
  }
  return result.data;
}

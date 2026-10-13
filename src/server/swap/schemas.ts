import { z } from "zod";

/**
 * Zod schemas for the swap boundary.
 *
 * Bodies are parsed by `parseJson` (`http/validation.ts`), which returns
 * flattened field errors and never echoes the raw payload back to the caller.
 */

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "must be a 0x address");

export const quoteRequestSchema = z
  .object({
    /** Symbol ("USDC") or 0x address; resolved against the active registry. */
    inputToken: z.string().trim().min(1).max(64),
    outputToken: z.string().trim().min(1).max(64),
    /** Base atomic units as a positive integer string. */
    inputAmount: z.string().regex(/^[0-9]+$/, "must be a positive integer string").refine(
      (value) => {
        try {
          return BigInt(value) > 0n;
        } catch {
          return false;
        }
      },
      { message: "must be greater than zero" }
    ),
    /** Basis points (50 = 0.5%); the server pins the venue and the chain. */
    slippageTolerance: z.number().positive().max(5000).optional(),
    /** Accepted only so a stale client is told it is on the wrong network. */
    chainId: z.number().int().optional(),
  })
  .strict();

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const buildRequestSchema = z
  .object({
    /**
     * Tower's quote object, echoed back by the client. Only the fields we rely
     * on are asserted here; `passthrough` keeps Tower's own extras intact so the
     * request can be forwarded verbatim.
     */
    quote: z
      .object({
        inputToken: z.string().min(1),
        outputToken: z.string().min(1),
        inputAmount: z.string().min(1),
        outputAmount: z.string().min(1),
        minOut: z.string().min(1),
      })
      .passthrough(),
    userAddress: address,
  })
  .strict();

export type BuildRequest = z.infer<typeof buildRequestSchema>;

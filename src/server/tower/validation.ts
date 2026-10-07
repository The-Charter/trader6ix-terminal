import type { TowerQuoteRequest, TowerBuildTxRequest, TowerQuoteResponseData } from "@/lib/tower/types";
import { TowerValidationError } from "./errors";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isTokenReference(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  const token = value.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(token) || /^[A-Za-z0-9]{2,15}$/.test(token);
}

function isAtomicAmount(value: unknown): value is string {
  if (typeof value !== "string" || !/^[0-9]+$/.test(value)) return false;
  try {
    return BigInt(value) > 0n;
  } catch {
    return false;
  }
}

/** Validates and narrows a swap quote request body. */
export function parseQuoteRequest(body: unknown): TowerQuoteRequest {
  if (typeof body !== "object" || body === null) {
    throw new TowerValidationError("Request body must be a JSON object.");
  }
  const raw = body as Record<string, unknown>;

  if (!isTokenReference(raw.inputToken)) {
    throw new TowerValidationError("inputToken must be a token symbol or a 0x contract address.");
  }
  if (!isTokenReference(raw.outputToken)) {
    throw new TowerValidationError("outputToken must be a token symbol or a 0x contract address.");
  }
  if (!isAtomicAmount(raw.inputAmount)) {
    throw new TowerValidationError("inputAmount must be a positive integer string in base atomic units.");
  }

  const request: TowerQuoteRequest = {
    inputToken: raw.inputToken,
    outputToken: raw.outputToken,
    inputAmount: raw.inputAmount,
  };

  if (raw.slippageTolerance !== undefined) {
    if (
      typeof raw.slippageTolerance !== "number" ||
      !Number.isFinite(raw.slippageTolerance) ||
      raw.slippageTolerance <= 0 ||
      raw.slippageTolerance > 5000
    ) {
      throw new TowerValidationError("slippageTolerance must be between 1 and 5000 basis points.");
    }
    request.slippageTolerance = raw.slippageTolerance;
  }

  if (raw.dexId !== undefined) {
    if (!isNonEmptyString(raw.dexId)) {
      throw new TowerValidationError("dexId must be a non-empty string.");
    }
    request.dexId = raw.dexId;
  }

  if (raw.chainId !== undefined) {
    if (typeof raw.chainId !== "number" || !Number.isInteger(raw.chainId)) {
      throw new TowerValidationError("chainId must be an integer.");
    }
    request.chainId = raw.chainId;
  }

  return request;
}

/** Validates and narrows a build-transaction request body. */
export function parseBuildTxRequest(body: unknown): TowerBuildTxRequest {
  if (typeof body !== "object" || body === null) {
    throw new TowerValidationError("Request body must be a JSON object.");
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.quote !== "object" || raw.quote === null) {
    throw new TowerValidationError("quote must be the quote data object returned by the quote endpoint.");
  }
  if (!isNonEmptyString(raw.userAddress) || !/^0x[a-fA-F0-9]{40}$/.test(raw.userAddress)) {
    throw new TowerValidationError("userAddress must be a valid 0x wallet address.");
  }

  return {
    quote: raw.quote as TowerQuoteResponseData,
    userAddress: raw.userAddress,
  };
}

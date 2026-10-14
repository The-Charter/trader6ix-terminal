import "server-only";
import { importSPKI, jwtVerify } from "jose";
import { PRIVY_APP_ID } from "@/lib/privy-app";

/** Whatever jose hands back for an imported SPKI key (ES256 → CryptoKey). */
type VerificationKey = Awaited<ReturnType<typeof importSPKI>>;

/**
 * Server-side verification of Privy access tokens.
 *
 * Privy owns authentication (and the JWTs): the browser gets an access token
 * from `usePrivy().getAccessToken()` and sends it as `Authorization: Bearer
 * <token>`. This module is the only place that decides whether such a token is
 * genuine — it verifies:
 *
 *   - signature   against the app's Privy verification key (ES256)
 *   - issuer      `privy.io`
 *   - audience    the Privy app id (`NEXT_PUBLIC_PRIVY_APP_ID`)
 *   - expiry      carried in `exp` (jose enforces it)
 *
 * and then extracts the stable identity (`sub`, a `did:privy:…` DID) plus the
 * user's linked EVM wallet (from the `linked_accounts` claim, falling back to a
 * server API lookup when `PRIVY_APP_SECRET` is configured).
 *
 * FAIL CLOSED: when the verification key is absent this throws, so every
 * authenticated route answers 401 rather than trusting an unverified token.
 */

const ISSUER = "privy.io";
/**
 * Privy signs access tokens with ES256. Their documentation describes the
 * verification key as an Ed25519 key in prose while every code sample imports it
 * for ES256, so both are attempted at import time and the JWT is then verified
 * against whichever the key actually is. This weakens nothing: the signature
 * still has to verify against this exact pinned key.
 */
const ALGORITHMS = ["ES256", "EdDSA"] as const;
const PRIVY_API_BASE = "https://auth.privy.io/api/v1";
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export interface PrivyIdentity {
  /** `did:privy:…` — stable, provider-issued user id. */
  did: string;
  /** Primary linked EVM wallet, when the user has one. */
  wallet: string | null;
  /** Every linked EVM wallet — used for ownership checks, not just display. */
  wallets: string[];
  /** Privy session id (`sid`), useful for auditing. */
  sessionId: string | null;
}

function appId(): string {
  if (!PRIVY_APP_ID) {
    throw new Error("Privy app id is not configured — cannot verify access tokens.");
  }
  return PRIVY_APP_ID;
}

function verificationKeyPem(): string {
  const pem = process.env.PRIVY_VERIFICATION_KEY;
  if (!pem || pem.trim() === "") {
    throw new Error(
      "Missing PRIVY_VERIFICATION_KEY. Copy the verification key from the Privy dashboard " +
        "(App settings) into .env.local — until then every authenticated request is rejected."
    );
  }
  // The dashboard sometimes hands the PEM out on one line with literal \n
  // escapes; normalise both shapes before importing.
  const trimmed = pem.trim();
  return trimmed.includes("\n") ? trimmed : trimmed.replace(/\\n/g, "\n");
}

interface ImportedVerificationKey {
  key: VerificationKey;
  algorithm: string;
}

async function importVerificationKey(): Promise<ImportedVerificationKey> {
  const pem = verificationKeyPem();
  const failures: string[] = [];

  for (const algorithm of ALGORITHMS) {
    try {
      return { key: await importSPKI(pem, algorithm), algorithm };
    } catch (err) {
      failures.push(`${algorithm}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  throw new Error(
    `PRIVY_VERIFICATION_KEY could not be imported as a public key (${failures.join("; ")}). ` +
      "Re-copy the key from the Privy dashboard (Configuration -> App settings)."
  );
}

let cachedKey: Promise<ImportedVerificationKey> | null = null;

function verificationKey(): Promise<ImportedVerificationKey> {
  if (!cachedKey) {
    cachedKey = importVerificationKey().catch((err) => {
      // Do not cache a failed import: a corrected key must work without a restart.
      cachedKey = null;
      throw err;
    });
  }
  return cachedKey;
}

/** Every ethereum wallet in a Privy `linked_accounts` claim, in listed order. */
function walletsFromLinkedAccounts(raw: unknown): string[] {
  let accounts: unknown = raw;
  if (typeof raw === "string") {
    try {
      accounts = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(accounts)) return [];

  const wallets: string[] = [];
  for (const entry of accounts) {
    if (!entry || typeof entry !== "object") continue;
    const account = entry as Record<string, unknown>;
    if (account.type !== "wallet") continue;
    const chainType = typeof account.chain_type === "string" ? account.chain_type : "";
    if (chainType !== "" && chainType !== "ethereum") continue;
    const address = typeof account.address === "string" ? account.address : "";
    if (EVM_ADDRESS.test(address) && !wallets.includes(address)) wallets.push(address);
  }
  return wallets;
}

/**
 * Fetches a user's linked wallets from Privy, cached briefly.
 *
 * This is the authoritative source for authorization: the access token does not
 * always carry `linked_accounts` (Privy documents its claims as sid/sub/iss/aud/
 * iat/exp only), so ownership checks depend on this lookup — which in turn
 * depends on `PRIVY_APP_SECRET`. When that is missing the lookup cannot work at
 * all, and it says so loudly rather than returning an empty list that would
 * silently lock every user out of their own data.
 */
const walletCache = new Map<string, { at: number; wallets: string[] }>();
const WALLET_CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchLinkedWallets(did: string): Promise<string[]> {
  const cached = walletCache.get(did);
  if (cached && Date.now() - cached.at < WALLET_CACHE_TTL_MS) return cached.wallets;

  const secret = process.env.PRIVY_APP_SECRET;
  if (!secret || secret.trim() === "") {
    console.error(
      "PRIVY_APP_SECRET is not set on this host, so a user's linked wallets cannot be resolved. " +
        "Authorization will reject every wallet-scoped request until it is."
    );
    return [];
  }

  try {
    const response = await fetch(`${PRIVY_API_BASE}/users/${encodeURIComponent(did)}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${appId()}:${secret.trim()}`).toString("base64")}`,
        "privy-app-id": appId(),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`Privy user lookup for ${did} failed with status ${response.status}.`);
      return [];
    }

    const user = (await response.json()) as { linked_accounts?: unknown };
    const wallets = walletsFromLinkedAccounts(user.linked_accounts);
    if (walletCache.size > 500) walletCache.clear();
    walletCache.set(did, { at: Date.now(), wallets });
    return wallets;
  } catch (err) {
    console.warn("Privy user lookup failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/** Verifies a Privy access token and returns the caller's identity. Throws on any failure. */
export async function verifyPrivyAccessToken(token: string): Promise<PrivyIdentity> {
  const { key, algorithm } = await verificationKey();
  const { payload } = await jwtVerify(token, key, {
    algorithms: [algorithm],
    issuer: ISSUER,
    audience: appId(),
  });

  const did = typeof payload.sub === "string" ? payload.sub : "";
  if (!did.startsWith("did:")) {
    throw new Error("Privy access token has no subject DID.");
  }

  let wallets = walletsFromLinkedAccounts(payload.linked_accounts);
  if (wallets.length === 0) wallets = await fetchLinkedWallets(did);
  const sessionId = typeof payload.sid === "string" ? payload.sid : null;

  return { did, wallet: wallets[0] ?? null, wallets, sessionId };
}

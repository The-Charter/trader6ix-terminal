import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { AuthenticatedUser, Role } from "./types";

const ALGORITHM = "HS256";
const ISSUER = "trader6ix";
const AUDIENCE = "trader6ix-api";
const ACCESS_TOKEN_TTL = "1h";
const MIN_SECRET_LENGTH = 32;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`Missing or weak AUTH_JWT_SECRET (>= ${MIN_SECRET_LENGTH} chars). Add it to .env.local.`);
  }
  return new TextEncoder().encode(secret);
}

export async function issueAccessToken(user: AuthenticatedUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secretKey());
}

/** Verifies signature, algorithm, issuer, audience and required claims. */
export async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  const { payload } = await jwtVerify(token, secretKey(), {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  const id = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  const role: Role = payload.role === "admin" ? "admin" : "user";
  if (!id || !email) throw new Error("Invalid access token claims");

  return { id, email, role };
}

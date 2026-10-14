import type { Role } from "@/server/auth/types";

/** A user as stored in Postgres. */
export interface UserRecord {
  id: string;
  /** Privy DID — the identity the auth layer verified. */
  did: string;
  wallet: string | null;
  /** Every wallet verified for this user, from Privy. */
  wallets: string[];
  role: Role;
  createdAt: string;
}

/** Client-safe projection of a user (no tokens, no password material exists). */
export interface PublicUser {
  id: string;
  did: string;
  wallet: string | null;
  wallets: string[];
  role: Role;
  createdAt: string;
}

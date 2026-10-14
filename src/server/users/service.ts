import "server-only";
import * as repository from "./repository";
import { roleFromAllowlist } from "@/server/auth/roles";
import { notFound } from "@/server/http/errors";
import type { PrivyIdentity } from "@/server/auth/privy";
import type { PublicUser, UserRecord } from "./types";

export function toPublic(user: UserRecord): PublicUser {
  return {
    id: user.id,
    did: user.did,
    wallet: user.wallet,
    wallets: user.wallets,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Maps a *verified* Privy identity onto a local user row, creating it on first
 * contact. Authentication itself is Privy's job; this only owns the local
 * profile, its role, and the wallets authorization needs.
 */
export async function resolveIdentity(identity: PrivyIdentity): Promise<UserRecord> {
  const user = await repository.upsertByDid(identity.did, identity.wallet, identity.wallets);

  // The env allowlist can only promote, and the promotion is persisted so that
  // Postgres remains the source of truth for every later request.
  const allowlisted = roleFromAllowlist(identity.did);
  if (allowlisted && allowlisted !== user.role) {
    await repository.setRole(user.id, allowlisted);
    return { ...user, role: allowlisted };
  }

  return user;
}

/** Records wallets learned from Privy so later requests need no lookup. */
export async function rememberWallets(userId: string, wallets: string[]): Promise<void> {
  await repository.setWallets(userId, wallets);
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await repository.findById(userId);
  if (!user) throw notFound("User not found.");
  return toPublic(user);
}

export async function listUsers(): Promise<PublicUser[]> {
  return repository.listAll();
}

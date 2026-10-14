import "server-only";
import { query } from "@/server/db/pool";
import type { Role } from "@/server/auth/types";
import type { PublicUser, UserRecord } from "./types";

interface UserRow {
  id: string;
  privy_did: string;
  wallet: string | null;
  wallets: string[] | null;
  role: Role;
  created_at: Date;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    did: row.privy_did,
    wallet: row.wallet,
    wallets: row.wallets ?? [],
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Upserts the local row for a verified Privy identity and returns it.
 *
 * Runs on every authenticated request so a brand-new Privy account is usable on
 * its very first call. An identity that carries no wallets must NOT wipe the
 * stored ones — that is exactly how a user gets locked out of their own data.
 */
export async function upsertByDid(did: string, wallet: string | null, wallets: string[]): Promise<UserRecord> {
  const res = await query<UserRow>(
    `insert into users (privy_did, wallet, wallets) values ($1, $2, $3)
     on conflict (privy_did) do update
       set wallet  = coalesce(excluded.wallet, users.wallet),
           wallets = case when cardinality(excluded.wallets) > 0
                          then excluded.wallets
                          else users.wallets
                     end
     returning id, privy_did, wallet, wallets, role, created_at`,
    [did, wallet, wallets]
  );
  return mapUser(res.rows[0]);
}

export async function findById(id: string): Promise<UserRecord | null> {
  const res = await query<UserRow>(
    `select id, privy_did, wallet, wallets, role, created_at from users where id = $1 limit 1`,
    [id]
  );
  return res.rows[0] ? mapUser(res.rows[0]) : null;
}

/** Records wallets verified from Privy, so later requests need no lookup. */
export async function setWallets(id: string, wallets: string[]): Promise<void> {
  if (wallets.length === 0) return;
  await query(
    `update users
        set wallets = $2,
            wallet  = coalesce(wallet, $3)
      where id = $1`,
    [id, wallets, wallets[0]]
  );
}

export async function setRole(id: string, role: Role): Promise<void> {
  await query(`update users set role = $2 where id = $1`, [id, role]);
}

export async function listAll(): Promise<PublicUser[]> {
  const res = await query<{
    id: string;
    privy_did: string;
    wallet: string | null;
    wallets: string[] | null;
    role: Role;
    created_at: Date;
  }>(`select id, privy_did, wallet, wallets, role, created_at from users order by created_at desc limit 100`);
  return res.rows.map((row) => ({
    id: row.id,
    did: row.privy_did,
    wallet: row.wallet,
    wallets: row.wallets ?? [],
    role: row.role,
    createdAt: row.created_at.toISOString(),
  }));
}

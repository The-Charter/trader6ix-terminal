import "server-only";
import { query } from "@/server/db/pool";
import type { Role } from "@/server/auth/types";
import type { PublicUser, UserRecord } from "./types";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findByEmail(email: string): Promise<UserRecord | null> {
  const res = await query<UserRow>(
    `select id, email, password_hash, role, created_at from users where lower(email) = lower($1) limit 1`,
    [email]
  );
  return res.rows[0] ? mapUser(res.rows[0]) : null;
}

export async function insert(email: string, passwordHash: string, role: Role): Promise<UserRecord> {
  const res = await query<UserRow>(
    `insert into users (email, password_hash, role) values ($1, $2, $3)
     returning id, email, password_hash, role, created_at`,
    [email, passwordHash, role]
  );
  return mapUser(res.rows[0]);
}

export async function listAll(): Promise<PublicUser[]> {
  const res = await query<{ id: string; email: string; role: Role; created_at: Date }>(
    `select id, email, role, created_at from users order by created_at desc limit 100`
  );
  return res.rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  }));
}

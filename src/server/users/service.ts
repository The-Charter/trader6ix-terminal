import "server-only";
import * as repository from "./repository";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { issueAccessToken } from "@/server/auth/jwt";
import { conflict, unauthorized } from "@/server/http/errors";
import type { PublicUser, UserRecord } from "./types";

function toPublic(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function register(email: string, password: string): Promise<{ user: PublicUser; token: string }> {
  const existing = await repository.findByEmail(email);
  if (existing) throw conflict("An account with that email already exists.");

  const user = await repository.insert(email, await hashPassword(password), "user");
  const token = await issueAccessToken({ id: user.id, email: user.email, role: user.role });
  return { user: toPublic(user), token };
}

export async function login(email: string, password: string): Promise<{ user: PublicUser; token: string }> {
  const user = await repository.findByEmail(email);
  // Same message for unknown email and wrong password (no account enumeration).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized("Invalid email or password.");
  }

  const token = await issueAccessToken({ id: user.id, email: user.email, role: user.role });
  return { user: toPublic(user), token };
}

export async function listUsers(): Promise<PublicUser[]> {
  return repository.listAll();
}

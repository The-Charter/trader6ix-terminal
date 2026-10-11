import type { Role } from "@/server/auth/types";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

/** A user shape safe to return to clients (never includes the password hash). */
export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

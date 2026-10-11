export type Role = "user" | "admin";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

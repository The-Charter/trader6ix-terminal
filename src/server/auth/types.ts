/** Roles recognised by the API. Stored per user in Postgres. */
export type Role = "user" | "admin";

/**
 * The authenticated caller, as seen by controllers and services.
 *
 * `id` is our own Postgres uuid and stays the owner key for user data, while
 * `did` is the identity Privy vouches for. Controllers never see the raw token.
 */
export interface AuthenticatedUser {
  id: string;
  did: string;
  wallet: string | null;
  /** Every wallet the caller's Privy account links — drives ownership checks. */
  wallets: string[];
  role: Role;
}

# Backend (`src/server`)

Production-grade backend layer for the Trader6ix app. It runs inside the
Next.js deployment (no separate service), exposed under `/api/v1/*` plus a
read-only data plane under `/api/data/*`.

## Architecture

```
request
  -> middleware   src/server/http/with-api.ts   (rate limit -> auth -> authz -> idempotency -> handler -> error boundary)
  -> controller   src/server/<domain>/controller.ts  (parse + validate input, call service, shape response)
  -> service      src/server/<domain>/service.ts     (business rules, framework-agnostic)
  -> repository   src/server/<domain>/repository.ts  (Postgres access)
```

Controllers never touch SQL, services never touch `req`/`res`, and repositories
contain no business rules.

Shared building blocks:

| Path | Responsibility |
| --- | --- |
| `http/with-api.ts` | The cross-cutting pipeline every route runs through |
| `http/errors.ts` | `ApiError` + typed factory helpers (safe, mapped HTTP status) |
| `http/responses.ts` | `{ data }` / `{ error: { code, message, requestId } }` envelopes |
| `http/rate-limit.ts` | Per-caller token bucket |
| `http/validation.ts` | Zod JSON body parsing (flattened field errors) |
| `auth/privy.ts` | **Verify Privy-issued access tokens** (ES256, issuer/audience/expiry) |
| `auth/ownership.ts` | `requireOwnedWallet` — a caller may only read/act on their own wallets |
| `auth/roles.ts` | `requireRole` (RBAC) + the `ADMIN_PRIVY_DIDS` bootstrap allowlist |
| `swap/controller.ts` | Swap quote/build against Tower (chain + venue pinned server-side) |
| `users/*` | Local profile keyed by Privy DID (upserted on first contact) |
| `idempotency/store.ts` | Postgres-backed keys: reserve → replay → release, payload-bound, TTL |
| `arc-rpc/client.ts` | Balances and history read straight off Arc over JSON-RPC |
| `tower/client.ts` | Server-side Tower API access (key never leaves the server) |
| `db/pool.ts` | Lazy Postgres pool |
| `migrations/` | Versioned SQL applied by `npm run migrate` |

## Authentication & authorization

**Authentication is owned by Privy.** There is no register/login endpoint and no
password anywhere in this codebase.

1. The browser signs in with Privy and receives an access token (JWT).
2. Every request to `/api/v1/*` (and the `/api/data/*` data plane) sends it as
   `Authorization: Bearer <token>`.
3. `auth/privy.ts` verifies the signature against the app's Privy verification
   key, plus issuer (`privy.io`), audience (the Privy app id) and expiry, then
   extracts the user's DID and every linked EVM wallet.
4. `users/service.resolveIdentity` upserts the local row by DID (one round trip,
   so a brand-new account works on its first call) and reads its role.

**Authorization is ours.** Roles live in Postgres (`user` / `admin`) and the
`ADMIN_PRIVY_DIDS` env allowlist can promote — never demote — a DID, so the first
admin needs no SQL. Beyond role checks, services enforce ownership: the data
plane only serves wallets linked to the calling account, and a swap transaction
is only ever built for a wallet the caller controls.

**Fail closed:** with `PRIVY_VERIFICATION_KEY` unset, every authenticated route
returns 401 instead of trusting an unverified token.

## Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/v1/auth/session` | bearer | the caller's own profile |
| GET | `/api/v1/watchlist` | bearer | list the caller's items |
| POST | `/api/v1/watchlist` | bearer | **requires `Idempotency-Key`** |
| GET | `/api/v1/watchlist/:id` | bearer | owner-scoped |
| DELETE | `/api/v1/watchlist/:id` | bearer | owner-scoped, **requires key** |
| POST | `/api/v1/swap/quote` | bearer | Tower quote; trusted tokens only |
| POST | `/api/v1/swap/build` | bearer | **requires `Idempotency-Key`**; returns the unsigned tx |
| GET | `/api/v1/admin/users` | bearer + `admin` | RBAC |
| GET | `/api/data/portfolio` | bearer | balances for one of the caller's wallets |
| GET | `/api/data/activity` | bearer | recent transfers/swaps, same wallet rule |
| GET | `/api/data/trades` | bearer | executed swaps + PnL, same wallet rule |

Every response carries `x-request-id`. `GET /api/tower/tokens|prices|dexes`
remain public market-data proxies.

## Idempotency (why retries cannot double-spend)

Every mutating request to `/api/v1/*` **requires** an `Idempotency-Key`
(enforced by default in the middleware, so a new route cannot forget it), and
`POST /api/v1/swap/build` is the one that moves money.

- **Reserve** → the first request inserts `(key, scope)` where scope is
  `METHOD path user`.
- **Replay** → a retry with the same key returns the stored status and body with
  `idempotency-replayed: true`, so the client gets the *same* unsigned
  transaction instead of a second, differently-priced one.
- **In progress** → a concurrent duplicate gets `409`.
- **Mismatch** → the same key with a *different* body is rejected with `409`
  rather than replaying an unrelated response.
- **Release** → a thrown error or a 5xx frees the key so a genuine retry runs.
- Entries expire after 24h and are purged opportunistically.

On the client, `apiFetch` attaches a key automatically; pass `idempotencyKey` to
reuse one across retries of a single user action. Each *new* economic attempt
(such as re-quoting after a stale quote) deliberately uses a fresh key.

## Data plane

Balances and history are read straight from Arc over JSON-RPC
(`arc-rpc/client.ts`): `eth_call` for `balanceOf`, paged `eth_getLogs` for
transfers. The Arc mainnet explorer API sits behind a Cloudflare challenge that
answers server-side calls with 403, so it is not used. The public RPC caps a log
range at ~5,000 blocks and Arc produces a block every ~0.5s, so history is
scanned in pages, newest first, and stops early once it has enough. Results are
cached in-process for 45s because the UI polls.

Swaps are detected structurally (one transaction that sends one trusted token
and receives another) rather than by a venue's method selector, so they are
recognised across routers.

## Setup

1. Add to `.env.local`:
   ```
   DATABASE_URL=postgres://user:pass@host:5432/dbname   # pooled
   DIRECT_URL=postgres://user:pass@host:5432/dbname     # direct, for migrations
   NEXT_PUBLIC_PRIVY_APP_ID=...
   PRIVY_VERIFICATION_KEY=-----BEGIN PUBLIC KEY-----...
   # optional: PRIVY_APP_SECRET=... for server-side Privy user lookups
   ADMIN_PRIVY_DIDS=did:privy:...
   ```
2. Run migrations: `npm run migrate`
3. Call the API with a Privy access token:
   ```
   curl localhost:3000/api/v1/auth/session -H "Authorization: Bearer $PRIVY_TOKEN"
   ```

## Production notes / trade-offs

- **Rate limiting is in-memory** — correct for one instance; move it behind Redis
  for multi-instance/serverless (`http/rate-limit.ts` is the single seam).
- **History is bounded** by the RPC's 5,000-block log window (≈4.3h across six
  pages). Deeper history needs an indexer/subgraph, not more RPC calls.
- **Block timestamps** come from block headers when available and otherwise fall
  back to the measured block rate; they are display data, not settlement data.
- **Idempotency scope includes the caller**, so two users can never collide on a
  key (a UUID from a client is not a coordination mechanism).
- **JWKS rotation**: the verification key is cached after first import; a key
  rotation needs a redeploy (or a cache TTL) to take effect.

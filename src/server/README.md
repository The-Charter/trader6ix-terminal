# Backend (`src/server`)

Production-grade backend layer for the Trader6ix app. It runs inside the
Next.js deployment (no separate service), exposed under `/api/v1/*`.

## Architecture

```
request
  -> middleware   src/server/http/with-api.ts   (rate limit -> auth -> authz -> idempotency -> error boundary)
  -> controller   src/server/<domain>/controller.ts  (parse + validate input, call service, format response)
  -> service      src/server/<domain>/service.ts     (business rules, framework-agnostic)
  -> repository   src/server/<domain>/repository.ts  (Postgres access)
```

Shared building blocks:

| Path | Responsibility |
| --- | --- |
| `http/with-api.ts` | The cross-cutting pipeline every route runs through |
| `http/errors.ts` | `ApiError` + typed factory helpers (safe, mapped HTTP status) |
| `http/responses.ts` | `{ data }` / `{ error: { code, message, requestId } }` envelopes |
| `http/rate-limit.ts` | Per-caller token bucket |
| `http/validation.ts` | Zod JSON body parsing |
| `auth/jwt.ts` | Issue/verify HS256 access tokens (issuer, audience, alg pinned) |
| `auth/password.ts` | scrypt hashing + constant-time verification |
| `auth/roles.ts` | `requireRole` (RBAC) |
| `idempotency/store.ts` | Postgres-backed idempotency keys with in-progress detection |
| `db/pool.ts` | Lazy Postgres pool |
| `migrations/` | Versioned SQL applied by `npm run migrate` |

## Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | public | 201; returns `{ user, token }` |
| POST | `/api/v1/auth/login` | public | returns `{ user, token }` |
| GET | `/api/v1/watchlist` | bearer | list the caller's items |
| POST | `/api/v1/watchlist` | bearer | **requires `Idempotency-Key`** |
| GET | `/api/v1/watchlist/:id` | bearer | owner-scoped |
| DELETE | `/api/v1/watchlist/:id` | bearer | owner-scoped |
| GET | `/api/v1/admin/users` | bearer + `admin` role | RBAC demo |

Every response carries `x-request-id`.

## Security properties

- **No secret leakage**: internal errors are logged server-side and returned as a
  generic `INTERNAL` error; only `ApiError`s expose messages.
- **AuthN**: HS256 JWT with a pinned algorithm, issuer, audience and required
  claims; secret must be >= 32 chars.
- **AuthZ**: role checks in the pipeline, plus per-resource ownership checks in
  services (a JWT never proves ownership on its own).
- **Idempotency**: `Idempotency-Key` on POST; concurrent duplicates get `409`.
- **Rate limiting**: token bucket per IP + route.
- **Validation**: Zod schemas at the boundary; flattened field errors.
- **Headers**: `nosniff`, `DENY` framing, referrer policy, HSTS, no-store on API.

## Setup

1. Add to `.env.local`:
   ```
   DATABASE_URL=postgres://user:pass@host:5432/dbname
   AUTH_JWT_SECRET=<at least 32 random chars>
   ```
2. Run migrations:
   ```
   npm run migrate
   ```
3. Call the API, e.g.:
   ```
   curl -X POST localhost:3000/api/v1/auth/register \
     -H 'content-type: application/json' \
     -d '{"email":"a@b.com","password":"correct horse battery staple"}'
   ```

## Production notes / trade-offs

- **Rate limiting is in-memory** — correct for one instance; move it behind Redis
  for multi-instance/serverless (`http/rate-limit.ts` is the single seam).
- **Password hashing uses scrypt** via `node:crypto` (no native dependency). If you
  need Argon2id, swap `auth/password.ts`.
- **Access tokens only** (1h). Refresh-token rotation needs atomic persistence and
  concurrency tests before it is added.
- **Idempotency rows never expire** on their own; schedule a cleanup deleting rows
  older than ~24h.

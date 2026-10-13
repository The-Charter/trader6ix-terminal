# Deploying Trader6ix

The app is a single Next.js deployment (no separate backend service): API routes
under `/api/v1` and `/api/data`, plus the pages. Any Node host works; Vercel is
the path of least resistance because the project is already a standard Next app.

## 1. Environment variables

Two rules decide everything below:

- **`NEXT_PUBLIC_*` values are inlined at BUILD time.** Changing one requires a
  redeploy, not just a restart.
- **Everything else is read at RUNTIME** and must never be prefixed
  `NEXT_PUBLIC_`, or it ships to the browser.

### Required for the app to work

| Variable | Kind | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ARC_CHAIN_ID` | build | `5042` for mainnet |
| `NEXT_PUBLIC_ARC_RPC_URL` | build | public endpoint, used by the browser for wallet chain config |
| `NEXT_PUBLIC_ARC_EXPLORER_URL` | build | `https://explorer.arc.io` |
| `NEXT_PUBLIC_FAUCET_URL` | build | leave **empty** on mainnet so the UI hides the faucet |
| `NEXT_PUBLIC_PRIVY_APP_ID` | build | must match the app the verification key came from |
| `PRIVY_VERIFICATION_KEY` | **runtime, secret** | without it every authenticated route 401s (fail-closed by design) |
| `DATABASE_URL` | **runtime, secret** | Supabase **transaction pooler**, port 6543 |
| `TOWER_API_KEY` | **runtime, secret** | swaps cannot quote or build without it |
| `ARC_RPC_URL` | **runtime, secret** | dedicated RPC (QuickNode etc.). Server-only so the API key stays off the client |
| `ADMIN_PRIVY_DIDS` | runtime | comma-separated DIDs granted the admin role |

### Optional / not used yet

| Variable | Notes |
| --- | --- |
| `DIRECT_URL` | only used by `npm run migrate`; not needed by the running app |
| `PRIVY_APP_SECRET` | enables server-side Privy lookups (linked-wallet refresh) |
| `DATABASE_POOL_MAX` | overrides the per-instance pool size (default 2 on Vercel, 10 elsewhere) |
| `TOWER_API_BASE_URL`, `NEXT_PUBLIC_TOWER_ENABLED` | Tower defaults are fine |
| `HIBACHI_*`, `STABLEFX_API_KEY` | Perps and FX are "coming soon"; unused |
| `GOLDSKY_API_KEY`, `NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL` | not used — data is read straight from Arc |

## 2. Privy dashboard (do this before the first deploy)

1. **Upgrade the app out of development mode.** The dashboard currently shows a
   "development mode" banner; production mode is what allows a real domain.
2. **Add the production origin** to the allowed origins (e.g.
   `https://trader6ix.xyz`), or wallet login will fail on the deployed domain
   while working fine on localhost.
3. Confirm **Arc Mainnet (5042)** is an allowed chain.
4. Copy the **verification key** again if the app is recreated — it is tied to the
   app ID, and `aud` must match `NEXT_PUBLIC_PRIVY_APP_ID` exactly.

## 3. Database

Migrations are **not** run by the build. Apply them explicitly against the
production database before the first deploy:

```
npm run migrate
```

It reads `DIRECT_URL` (falling back to `DATABASE_URL`) and is idempotent —
already-applied files are skipped, so re-running is safe.

## 4. Serverless behaviour worth knowing

These are deliberate trade-offs, not bugs:

- **Rate limiting is in-memory**, so on serverless it is per-instance and
  therefore approximate. `src/server/http/rate-limit.ts` is the single seam to
  move onto Redis when real traffic justifies it.
- **Chain caches are per-instance** (transfer scans 45s, block timestamps,
  in-flight de-duplication). Each instance warms its own; correctness is
  unaffected.
- **Idempotency and users live in Postgres**, so they are correctly shared across
  instances. This is why the swap build is safe to retry regardless of which
  instance serves the retry.
- The DB pool defaults to **2 connections per instance on Vercel**, because many
  short-lived instances multiply into pooler pressure.

## 5. Post-deploy smoke test

Run these against the deployed URL, in order:

1. `/` loads and the app-bar badge reads **Arc**.
2. Sign in with a wallet → `GET /api/v1/auth/session` returns **200**.
3. `/portfolio` shows real balances, allocation and activity.
4. `/spot` → enter an amount → a quote resolves (rate, minimum received,
   network fee in **USDC**).
5. Sign a small swap → the completion card reaches **"Swap completed"**, and the
   hash opens in the Arc explorer.
6. `GET /api/v1/auth/session` **without** a token still returns **401** — the
   fail-closed behaviour must survive deployment.

## 6. Before real money moves

- Rotate the Tower API key and the RPC key if they were ever pasted somewhere
  outside `.env.local`.
- Set `ADMIN_PRIVY_DIDS` so at least one admin exists.
- Decide the rate-limit story if you expect concurrent users.
- Note that on-chain history covers roughly the **last 8.6 hours** (paged
  `eth_getLogs`, bounded by the RPC's 10,000-block range limit). Anything older
  needs an indexer, not a faster RPC.

# Deploying Trader6ix

The app is a single Next.js codebase: API routes under `/api/v1` and `/api/data`,
plus the pages. It runs as **one deployment** by default, and can also be split
across two hosts (see "Split deployment" below).

---

## Split deployment: frontend on Netlify, API on Render

This is supported, but it is **two deployments of the same repository**, and it
needs three things wired up or it fails in confusing ways.

### What each host runs

| Host | Runs | Why |
| --- | --- | --- |
| **Netlify** | the Next.js **pages** | serves the UI from its CDN |
| **Render** | the Next.js app, used as the **API** | needs Node for `pg` and `ethers`; its pages are simply unused |

Both build the same repo. Netlify must point at the API, and the API must accept
Netlify's origin — that is the whole trick.

### 1. Netlify environment

`NEXT_PUBLIC_API_BASE_URL` is the one that matters. Without it the frontend calls
its **own** origin, where the API routes are dead, and every request 404s.

```
NEXT_PUBLIC_API_BASE_URL=https://<your-api>.onrender.com   # the Render URL
NEXT_PUBLIC_ARC_CHAIN_ID=5042
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.mainnet.arc.io
NEXT_PUBLIC_ARC_EXPLORER_URL=https://explorer.arc.io
NEXT_PUBLIC_FAUCET_URL=
NEXT_PUBLIC_PRIVY_APP_ID=<same app as the API verifies>
NEXT_PUBLIC_TOWER_ENABLED=true
```

**No secrets go on Netlify.** That is a genuine benefit of the split: the Tower
key, RPC key, database URL and Privy verification key exist only on Render.

### 2. Render environment

Everything from the "Required" table below **plus**:

```
CORS_ALLOWED_ORIGINS=https://<your-site>.netlify.app,https://<your-domain>
```

Comma separated, exact origins, no trailing slash. With this unset the API sends
**no CORS headers at all**, so a cross-origin frontend cannot call it. Auth is
Bearer-token based rather than cookie based, so no credentials mode is involved —
but `Idempotency-Key` is a custom header, which makes every mutating request a
preflighted `OPTIONS`, and that preflight is answered before authentication.

### 3. Privy

Add **both** origins to the Privy app's allowed origins (the Netlify site and any
custom domain). The Privy modal runs in the browser, so it is the *frontend*
origin that must be allowed — while the API verifies the token's `aud` against
the app ID, which is origin-independent.

### Caveats of the split

- The API routes are also built into the Netlify deployment. They are never
  called (the client targets `NEXT_PUBLIC_API_BASE_URL`) but they do exist.
- Every API call is a cross-origin request, so there is an extra preflight on
  first contact per route.
- `NEXT_PUBLIC_*` values are baked in at build time on **both** hosts: changing
  one needs a rebuild, not a restart.
- Two deploy pipelines to keep in sync. If that becomes annoying, deploying the
  whole app to Render alone removes the split entirely — nothing else changes.

---

## Single deployment

### 1. Environment variables

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
| `NEXT_PUBLIC_API_BASE_URL` | set only for a split deployment (see above); empty means same-origin |
| `CORS_ALLOWED_ORIGINS` | set only on the API host in a split deployment; empty means no CORS headers |
| `PRIVY_APP_SECRET` | enables server-side Privy lookups (linked-wallet refresh) |
| `DATABASE_POOL_MAX` | overrides the per-instance pool size (default 2 on Vercel, 10 elsewhere) |
| `TOWER_API_BASE_URL`, `NEXT_PUBLIC_TOWER_ENABLED` | Tower defaults are fine |
| `HIBACHI_*`, `STABLEFX_API_KEY` | Perps and FX are "coming soon"; unused |
| `GOLDSKY_API_KEY`, `NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL` | not used — data is read straight from Arc |

### 2. Privy dashboard (do this before the first deploy)

1. **Upgrade the app out of development mode.** The dashboard currently shows a
   "development mode" banner; production mode is what allows a real domain.
2. **Add the production origin** to the allowed origins (e.g.
   `https://trader6ix.xyz`), or wallet login will fail on the deployed domain
   while working fine on localhost.
3. Confirm **Arc Mainnet (5042)** is an allowed chain.
4. Copy the **verification key** again if the app is recreated — it is tied to the
   app ID, and `aud` must match `NEXT_PUBLIC_PRIVY_APP_ID` exactly.

### 3. Database

Migrations are **not** run by the build. Apply them explicitly against the
production database before the first deploy:

```
npm run migrate
```

It reads `DIRECT_URL` (falling back to `DATABASE_URL`) and is idempotent —
already-applied files are skipped, so re-running is safe.

## Serverless behaviour worth knowing

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

## Post-deploy smoke test

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

## Before real money moves

- Rotate the Tower API key and the RPC key if they were ever pasted somewhere
  outside `.env.local`.
- Set `ADMIN_PRIVY_DIDS` so at least one admin exists.
- Decide the rate-limit story if you expect concurrent users.
- Note that on-chain history covers roughly the **last 8.6 hours** (paged
  `eth_getLogs`, bounded by the RPC's 10,000-block range limit). Anything older
  needs an indexer, not a faster RPC.

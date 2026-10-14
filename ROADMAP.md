# Trader6ix — Status & Roadmap

**Deployed and live on Arc Mainnet (chain 5042).**

| | |
| --- | --- |
| Frontend | **https://trader6ix.netlify.app** (Netlify, Git-connected to `main`) |
| API | **https://trader6ix-api.onrender.com** (Render, built from the public repo) |
| Source of truth | `main` — the two hosts build the same repository |

Spot swaps are live through Tower; Perps and FX are "coming soon"; the API is
Privy-authenticated, idempotent, and fails closed.

---

## Deployment shape

The API routes live inside the Next app, so the two hosts run the same codebase:

- **Netlify** serves the pages. It bakes in `NEXT_PUBLIC_API_BASE_URL`, which
  `next.config.js` resolves automatically for Netlify builds — no environment
  variables are required there at all.
- **Render** runs the app as the API. `CORS_ALLOWED_ORIGINS` names the Netlify
  origin; `FRONTEND_URL` (optional) makes it redirect page requests there so the
  API host is not a second, indexable copy of the site.
- Full detail, including the three settings that fail silently when missed, is
  in `DEPLOYMENT.md`.

---

## Where the project actually is

| Area | State |
| --- | --- |
| Spot swap | **Live on mainnet** — quote → build → signed in the user's wallet, routed by Tower |
| Portfolio / activity / trades | **Live** — read from Arc over JSON-RPC, scoped to the caller's own wallets |
| Perps | **Coming soon** — Hibachi connectivity still unresolved (see Blockers) |
| FX | **Coming soon** — Circle StableFX needs a KYB/AML-gated key |
| Auth | **Privy owns it** — no passwords, no self-issued JWTs, server verifies the Privy token |
| Authorization | Roles in Postgres + per-resource ownership checks |
| Idempotency | Required on every mutating `/api/v1` call, payload-bound, with replay |
| Prices | Tower `/prices` (CoinGecko removed — free tier rate-limited and missing cNGN/QCAD/cirBTC) |
| Indexed data | None — read the chain directly; Goldsky is not used |

### Switched to mainnet

- `NEXT_PUBLIC_ARC_CHAIN_ID=5042`, RPC `rpc.mainnet.arc.io`, explorer `explorer.arc.io`.
- Mainnet token registry: **USDC** (6), **EURC** (6), **cirBTC** (8) — the exact set
  Tower's mainnet venues route. All three addresses/decimals read off-chain.
- Venue routing is network-aware: mainnet lets Tower's aggregator route (aero,
  kyberswap, uniswap all build); testnet pins `tower-dex` because nothing else builds there.
- The faucet is hidden on mainnet, and the app bar shows which network you are on.

### Things that are easy to get wrong here

- **USDC history comes from Arc's native system emitter** (`0xff..fE`, 18 decimals),
  not the ERC-20 contract. A plain native send emits *only* the system log, so
  reading the ERC-20 contract alone silently misses it. Querying both double-counts.
- **A failed chain read is not a zero balance.** Unreadable assets are omitted and
  counted; a total failure returns an error rather than an empty portfolio.
- **Privy's `sendTransaction` only signs for embedded wallets.** Injected wallets
  (MetaMask, OKX) sign through their own provider, and sign-in is `login()`, never
  `connectWallet()` — that only links a wallet to an existing session.

---

## Blockers (need action, not more code)

### 1. Hibachi connectivity — blocks all Perps
Every Hibachi endpoint returns HTTP 200 with an empty body from our deployed
backend; most likely a WAF blocking datacenter IPs. Needs a response from
Hibachi confirming server-to-server access, or a testnet-specific base URL.

### 2. Deeper history (optional)
Activity covers roughly the **last 8.6 hours** — paged `eth_getLogs`, bounded by
the RPC's 10,000-block range limit. Anything older needs an indexer or subgraph,
not a faster RPC.

---

## Remaining actions

### Yours (dashboard work)
- [ ] **Privy: upgrade the app out of development mode** and confirm
      `https://trader6ix.netlify.app` is an allowed origin.
- [ ] **Rotate the QuickNode key** — it surfaced in a diagnostic dump twice.
      Replace `ARC_RPC_URL` on Render afterwards (runtime var, no rebuild).
- [ ] Optional: set `FRONTEND_URL` on Render so the API host stops serving pages
      (needs a rebuild).
- [ ] Set `ADMIN_PRIVY_DIDS` so at least one admin exists.

### Next
- [ ] Persist the app-bar notification read state per user instead of per session.
- [ ] Server-side watchlist UI (the API exists; no screen uses it yet).
- [ ] Decide whether to index history or keep the ~8.6-hour RPC window.
- [ ] Consider moving the **API to Express** (deliberately deferred). The frontend
      reaches the API only through `apiFetch` + `NEXT_PUBLIC_API_BASE_URL`, so the
      API can move without touching the UI — and a long-lived server makes the rate
      limiter and chain caches correct rather than per-instance approximations.

### Blocked on third parties
- [ ] Perps — Hibachi connectivity.
- [ ] FX — Circle StableFX key.

---

## Non-negotiables established along the way

- Secrets live in `.env.local` and the host's dashboard only, never in chat and
  never `NEXT_PUBLIC_`.
- No mocked or simulated values in the UI — an empty state says "empty".
- Signed on-chain transactions are never blind-retried; a retry replays the
  stored build so the user cannot sign two different swaps by accident.
- Only trusted Arc tokens are shown or routable, so airdrop spam and symbol
  clones stay invisible.
- A metric we cannot compute is shown as `—`, never as a plausible-looking zero.

# Trader6ix — Status & Roadmap

**Current target: Arc Mainnet (chain 5042).** Spot swaps are live through Tower;
Perps and FX are "coming soon"; the API is Privy-authenticated and idempotent.

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

---

## Blockers (need action, not more code)

### 1. Hibachi connectivity — blocks all Perps
Every Hibachi endpoint returns HTTP 200 with an empty body from our deployed
backend; most likely a WAF blocking datacenter IPs. Needs a response from
Hibachi confirming server-to-server access, or a testnet-specific base URL.

### 2. Private mainnet access (optional)
Arc's docs describe mainnet RPC as "permissioned" during the private phase. The
public `rpc.mainnet.arc.io` currently answers fine, but if rate limits bite,
request node-provider credentials.

### 3. Deeper history (optional)
The public RPC caps `eth_getLogs` at ~5,000 blocks (~43 min), so activity covers
about the last 4 hours. Deeper history needs an indexer or a subgraph.

---

## What you need to fill in

| Item | Where | Needed for |
| --- | --- | --- |
| `PRIVY_VERIFICATION_KEY` | Privy dashboard → App settings → Verification key | **Every authenticated request.** Until it is set, the API returns 401 by design |
| `DATABASE_URL` / `DIRECT_URL` | Supabase (pooler + direct) | Users, roles, watchlist, idempotency |
| `ADMIN_PRIVY_DIDS` | Your own DIDs | Bootstrapping the first admin |
| `PRIVY_APP_SECRET` | Privy dashboard | Optional: server-side user lookups |
| Circle StableFX key | Circle (KYB/AML) | FX |

After filling `DATABASE_URL`/`DIRECT_URL`: `npm run migrate`.

---

## Remaining work

### Now
- [ ] Fill `PRIVY_VERIFICATION_KEY` + the database URLs, then run the end-to-end pass:
      sign in → session resolves → portfolio loads → swap builds and signs on mainnet.
- [ ] Confirm Arc mainnet is an allowed chain in the Privy dashboard.

### Next
- [ ] Persist the app-bar notification read state per user instead of per session.
- [ ] Server-side watchlist UI (the API exists; no screen uses it yet).
- [ ] Decide whether to index history (subgraph) or keep the 4-hour RPC window.

### Blocked on third parties
- [ ] Perps — Hibachi connectivity.
- [ ] FX — Circle StableFX key.

---

## Non-negotiables established along the way

- Secrets live in `.env.local` / Vercel only, never in chat and never `NEXT_PUBLIC_`.
- No mocked or simulated values in the UI — an empty state says "empty".
- Signed on-chain transactions are never blind-retried; a retry replays the
  stored build so the user cannot sign two different swaps by accident.
- Only trusted Arc tokens are shown or routable, so airdrop spam and symbol
  clones stay invisible.

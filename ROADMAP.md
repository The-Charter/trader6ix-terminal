# Trader6ix — MVP Roadmap

Goal: a fully working trading terminal on Arc Testnet via `PerpsAdapter`
(Hibachi), `SpotAdapter` (Curve), with `FXAdapter` (StableFX) architected but
not required for launch. Goldsky paused, placeholders left in place.

---

## The two real blockers — need your action, not more code

Everything else in this roadmap is buildable right now. These two are not —
no amount of additional code fixes them, because they're not code problems.

### 1. Hibachi connectivity (blocks ALL perps functionality)
**Status:** every Hibachi endpoint (public and authenticated) returns HTTP 200
with an empty body when called from our deployed Vercel backend. Root cause
still unconfirmed — most likely a WAF/bot-mitigation layer silently blocking
datacenter IPs, per our earlier debugging session.
**What's needed:** a response from Hibachi's team confirming either (a) how
to get server-to-server access allowed, or (b) a separate testnet-specific
API base URL we should be using instead of production.
**Your action:** keep following up with them. If this stays unresolved much
longer, worth deciding on a fallback plan (see "Contingency" below) rather
than letting the whole MVP wait indefinitely on one vendor.

### 2. Curve pool contract address (blocks ALL spot functionality)
**Status:** Curve has a real, live, permissionless USDC/EURC pool on Arc
testnet (confirmed via their own swap UI and third-party guides), but I
don't have the actual pool contract address, and I have no way to look it up
myself from this environment.
**Your action (5 minutes):** open `curve.finance/dex/arc/swap`, connect a
wallet, select USDC → EURC, open DevTools → Network tab, and copy either the
contract address the transaction is about to call or any API response
containing `"address": "0x..."`. Send it to me and Curve's `SpotAdapter`
becomes real within the same session — their swap ABI (`exchange`, `get_dy`)
is standardized, so this isn't another multi-day debugging cycle.

---

## Phase-by-phase build order

### Phase A — Unblock (needs you)
- [ ] Get the Curve pool address (above)
- [ ] Hear back from Hibachi, or decide on a contingency

### Phase B — PerpsAdapter completion (I do this, once Hibachi responds)
Currently working: markets list, orderbook, chart, market/limit order
placement, positions/orders display.
Still missing for the full feature list you described:
- [ ] Modify stop-loss / take-profit on an open position — needs checking
      Hibachi's actual API for a SL/TP modification endpoint; not yet
      confirmed to exist in their public docs
- [ ] Leverage selection in the trade ticket — needs confirming how
      Hibachi's order payload expresses leverage
- [ ] Margin/liquidation-price display — depends on exact fields Hibachi's
      `/account/info` actually returns, which we can only see once real
      responses come back
- [ ] Real end-to-end test: connect wallet → fund via faucet → place a
      market order → see it as an open position → close it

### Phase C — SpotAdapter completion (I do this, once you have the pool address)
- [ ] Implement `getSwapQuote()` via Curve's `get_dy` view function
- [ ] Implement `swap()` — build the transaction, have the connected wallet
      (via Privy) sign and send it — **this step requires your wallet
      signature in the browser, not something automatable**
- [ ] Add a minimal spot swap UI (input amount, see quote, confirm swap) —
      replaces the current "coming soon" spot page
- [ ] Real end-to-end test: swap testnet USDC → EURC and back

### Phase D — FXAdapter (architecture only, no action needed for MVP)
Already scaffolded against Circle's confirmed endpoint and inactive by
design. No further work until you decide whether to pursue KYB/AML — this
phase doesn't block anything else.

### Phase E — Mobile experience (can run in parallel with B/C — doesn't depend on either)
- [ ] Landing page: choose Perpetual Futures / Spot / Stablecoin FX
- [ ] Bottom-tab terminal (Markets / Chart / Positions / History / Tools)
      matching the provided mobile reference, Trader6ix-branded
- [ ] Desktop stays exactly as-is structurally (per your instruction)

### Phase F — Goldsky (paused, resume later)
Placeholder `DataAdapter`/`goldskyDataAdapter` already in the codebase,
`isLive: false`, real subgraph config sitting in `/goldsky` ready to pick
back up. Nothing to do here until Phases A–E are solid.

---

## Credentials/accounts checklist

| Item | Status | Needed for |
|---|---|---|
| Hibachi API key/secret/account ID | Already have | Perps (blocked on connectivity, not credentials) |
| Curve pool address | **Missing — your action** | Spot |
| Circle StableFX API key | Paused (KYB/AML gate) | FX (not MVP-blocking) |
| Goldsky account | Have, paused | Data layer (not MVP-blocking) |
| Testnet USDC/EURC in your wallet | Needed for real end-to-end testing | Both Perps and Spot testing |

## What needs your hands specifically (can't be automated)
- Grabbing the Curve pool address (one-time DevTools task)
- Following up with Hibachi's team
- Every wallet signature — connecting, approving, signing swap/order
  transactions in the browser
- Funding your test wallet via the faucet
- Any future account signups (already done: GitHub, Vercel, Goldsky)

## What I can do without waiting on you
- All adapter code, error handling, UI polish
- Curve swap logic the moment I have the address
- Hibachi SL/TP/leverage/margin wiring the moment their API responds
- Mobile landing page + bottom-tab terminal (Phase E) — can start this now,
  in parallel, since it doesn't depend on either blocker

---

## Suggested immediate next step
Send me the Curve pool address whenever you get it — that's the fastest
path to "at least one fully working, real, tradeable flow" (spot swap),
independent of whatever's happening with Hibachi. In parallel, I can start
Phase E (mobile UI) right now if you'd like, since it's blocked by neither.

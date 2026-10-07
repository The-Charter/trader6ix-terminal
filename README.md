# Trader6ix Terminal

All-in-one trading terminal for FX and crypto traders, built on **Arc** (Circle's L1).

This is a **Next.js 14 (App Router) full-stack app**: the React UI and the server-side API
routes live in one deployable. The "backend" is the set of API route handlers under
`src/app/api/*`, which proxy the venue integrations in `src/server`.

## Repository layout

```
src/
  app/          Routes (Next.js App Router) — pages + API route handlers
    api/        Backend endpoints (server-side only): hibachi, tower, stablefx
  components/   Frontend UI (React components)
  adapters/     Venue adapters — one file per venue, behind a shared interface
  server/       Backend-only code (reads secrets; guarded by `server-only`)
  lib/          Shared, isomorphic helpers and types (hooks, markets, specs, tower types)
contracts/      Foundry project (Solidity AMM) — separate toolchain
goldsky/        Goldsky subgraph config — separate toolchain
public/         Static assets
```

### Where do I put things?

| I'm adding… | Put it in… |
| --- | --- |
| A UI component | `src/components` |
| A page or an API route | `src/app` |
| Code that talks to a venue and uses an API key | `src/server` (never import from a client component) |
| A shared helper, hook, or type | `src/lib` |
| A new trading venue | implement the interface in `src/adapters` and register it in `src/adapters/registry.ts` |

> `src/server/**` modules start with `import "server-only"`, so a client component that
> accidentally imports one fails the build instead of leaking a secret into the browser bundle.

## Getting started

```bash
cp .env.example .env.local   # then fill in your keys (never commit .env.local)
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |

## Contracts

The Solidity pool lives in `contracts/` and uses Foundry — see `contracts/README.md`.

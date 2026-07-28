# Goldsky setup — Trader6ix

This indexes USDC and EURC Transfer/Approval events on Arc testnet, which
powers wallet balances and transaction history via the `DataAdapter`
(`lib/adapters/goldsky-data-adapter.ts`). It does NOT touch trade execution —
that stays on Hibachi/StableFX/Curve regardless of Goldsky's status.

## 1. Install the CLI and log in

```bash
npm install -g @goldskycom/cli
goldsky login
```

This opens a browser to authenticate against the account you already created.

## 2. Verify the Arc chain slug

Before deploying, confirm the exact chain identifier Goldsky expects — either:
- run `goldsky subgraph init` and look for Arc in the interactive chain picker, or
- check https://docs.goldsky.com/chains/arc directly

Update the two `chain:` lines in `trader6ix.yaml` if it's not `arc-testnet`.

## 3. Deploy

```bash
cd goldsky
goldsky subgraph deploy trader6ix-arc-tokens/1.0.0 --from-abi trader6ix.yaml
```

This prints a GraphQL endpoint that looks like:
```
https://api.goldsky.com/api/public/project_.../subgraphs/trader6ix-arc-tokens/1.0.0/gn
```

## 4. Wire it into the app

Add that URL to Vercel's environment variables (and `.env.local` for local dev):
```
NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL=<the endpoint from step 3>
```

Once that's set, `goldskyDataAdapter.isLive` flips to `true` automatically —
no code changes needed.

## What's still a placeholder after this

The GraphQL queries in `goldsky-data-adapter.ts` (portfolio, transaction
history, trade history) use field/entity names that match what our UI needs,
but Goldsky's actual auto-generated schema for this instant-subgraph config
will use its own entity names (typically something like `transfers` or
`transferEvents`, derived from the event name). Once you have a real
endpoint, open its GraphiQL explorer (linked in the deploy output) to see the
actual schema, and I'll adjust the queries in `goldsky-data-adapter.ts` to
match — that's a quick fix once we can see real field names, not a rebuild.

## Later: StableFX and Curve events

Once we have a Curve pool address and/or StableFX credentials, add their
contract addresses and ABIs the same way — new `instances` entries in this
same config, or a second subgraph if you want them versioned separately.

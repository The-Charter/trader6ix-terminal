# Goldsky setup — Trader6ix

Indexes USDC and EURC `Transfer` events on Arc Testnet to power wallet balances
and transaction history via the `DataAdapter`
(`src/adapters/goldsky-data-adapter.ts`). It does not touch trade execution.

## 1. Install the CLI

Windows:

```
npm install -g @goldskycom/cli
```

macOS / Linux:

```
curl https://goldsky.com | sh
```

## 2. Log in

Interactive (opens a browser):

```
goldsky login
```

Headless / CI (create an API key at https://app.goldsky.com/dashboard/settings):

```
goldsky login --token <API_KEY>
```

## 3. Deploy the instant subgraph

```
cd goldsky
goldsky subgraph deploy trader6ix-arc-tokens/1.0.0 --from-abi trader6ix.yaml
```

The command prints a GraphQL endpoint such as:

```
https://api.goldsky.com/api/public/project_.../subgraphs/trader6ix-arc-tokens/1.0.0/gn
```

If the deploy reports an unknown chain, correct the `chain:` value in
`trader6ix.yaml` (Arc Testnet). Arc chain IDs: Mainnet `5042`, Testnet `5042002`.

## 4. Wire it into the app

Set in `.env.local` (and in Vercel's environment variables):

```
NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL=<endpoint from step 3>
```

`goldskyDataAdapter.isLive` then flips to `true` automatically — no other code
changes are needed for the adapter to be selected.

## 5. Confirm the schema

Open the endpoint's GraphiQL explorer (linked in the deploy output) and check the
auto-generated entity name for the ERC-20 `Transfer` event, then update the
queries in `src/adapters/goldsky-data-adapter.ts` to match that schema.

## Notes

- `startBlock: 0` in `trader6ix.yaml` indexes from genesis. Set it to the USDC /
  EURC contract deploy block to avoid a full-history backfill.
- To add more data later (Curve swaps, StableFX settlements), add new
  `instances` entries to the same config, or a second subgraph if you want them
  versioned separately.

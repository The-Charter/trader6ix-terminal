# Trader6ix EURC/USDC Pool — Foundry Contracts

A minimal constant-product AMM (x*y=k, 0.3% fee) for a single EURC/USDC pair on
Arc Testnet. Self-contained — no external Solidity dependencies to install for
the contract itself, only `forge-std` for tests/scripts (Foundry sets this up
automatically).

## 1. Set up Foundry (skip if already installed)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## 2. Install forge-std (needed for the test file and deploy script)

From inside `contracts/`:

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
```

## 3. Configure your environment

```bash
export ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
export PRIVATE_KEY="0xyour_funded_testnet_wallet_private_key"
```

Fund that wallet with testnet USDC first (needed for gas) via
https://faucet.circle.com — select Arc Testnet.

## 4. Run the tests (fully local, no Arc RPC needed)

```bash
forge test -vv
```

## 5. Deploy to Arc Testnet

```bash
forge script script/DeployPool.s.sol:DeployPool \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Copy the deployed address from the console output — you'll need it in step 7.

## 6. Verify on Arc's Blockscout explorer

```bash
forge verify-contract <DEPLOYED_ADDRESS> src/Trader6ixEurcUsdcPool.sol:Trader6ixEurcUsdcPool \
  --chain-id 5042002 \
  --verifier blockscout \
  --verifier-url https://testnet.arcscan.app/api/ \
  --constructor-args $(cast abi-encode "constructor(address,address)" 0x3600000000000000000000000000000000000000 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a)
```

## 7. Wire the frontend to your deployed pool

Add to the app's `.env.local` (or Vercel env vars):

```
NEXT_PUBLIC_ARC_AMM_ADDRESS=<DEPLOYED_ADDRESS>
```

## 8. Seed initial liquidity

The pool starts empty — no swaps will work until it has both sides funded.
From your wallet (e.g. via the explorer's "Write Contract" tab once verified,
or a small script), approve the pool for both USDC and EURC, then call
`addLiquidity(usdcAmount, eurcAmount)` with a realistic EUR/USD ratio
(roughly 1 USDC : 0.92 EURC at the time this was written — check a live rate
before seeding, since this drifts).

Until liquidity is seeded, the frontend will correctly show the pair as having
no liquidity rather than a fake price — this is expected, not a bug.

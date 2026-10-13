---
name: Trader6ix Terminal
colors:
  background: '#08090B'
  surface: '#0E1013'
  surface-container: '#14171B'
  surface-container-high: '#1A1E23'
  surface-container-highest: '#22272E'
  hairline: '#23272E'
  on-surface: '#F4F6F8'
  on-surface-variant: '#9AA3AD'
  outline: '#3A4048'
  primary: '#FF6A2B'
  on-primary: '#FFFFFF'
  primary-hover: '#FF7F45'
  primary-container: '#2A1508'
  on-primary-container: '#FFC7A3'
  successful: '#2FD37A'
  on-successful: '#04160C'
  destructive: '#FF4D5E'
  warning: '#F5B544'
  info: '#5AA9FF'
  chart-line: '#FF6A2B'
  chart-fill-top: '#FF6A2B33'
  chart-fill-bottom: '#FF6A2B00'
  chart-grid: '#1C2026'
typography:
  display:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '650'
    lineHeight: 52px
    letterSpacing: -0.03em
  headline:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  title:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  numeric:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  numeric-hero:
    fontFamily: JetBrains Mono
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.02em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  card:
    backgroundColor: '{surface-container}'
    textColor: '{on-surface}'
    rounded: '{rounded.lg}'
    padding: 20px
  stat-card:
    backgroundColor: '{surface-container}'
    textColor: '{on-surface}'
    rounded: '{rounded.lg}'
    padding: 16px
  pill:
    backgroundColor: '{surface-container-high}'
    textColor: '{on-surface-variant}'
    rounded: '{rounded.pill}'
    padding: 6px 12px
  empty-state:
    backgroundColor: '{surface}'
    textColor: '{on-surface-variant}'
    rounded: '{rounded.lg}'
    padding: 40px
---

# Trader6ix Terminal

A dark, dense, non-custodial trading terminal for **Arc mainnet** (chain 5042).
Spot swaps route through Tower; balances and on-chain history are read live from
Arc over RPC. This design system covers the signed-in application shell: app bar,
portfolio, spot ticket, and activity.

## Design principles

1. **Numbers first.** Every figure uses the mono numeric face with tabular
   figures so digits do not shift between refreshes. Money is never rendered in
   a proportional font.
2. **Honest data only.** Never render a value the backend cannot actually
   compute. No invented 24h deltas, no synthetic sparkline when there is no
   price history, no "risk score" that is not derived from real holdings. Where a
   metric is unavailable, show a quiet `--` with a tooltip, not a fake zero that
   looks real.
3. **Calm surfaces, one ember accent.** Near-black canvas, layered greys for
   panels, hairline borders. The ember orange is reserved for primary actions
   and the single active data series. Success/failure use green/red, never the
   accent, so a glance never confuses "brand" with "profit".
4. **Density with air.** Terminal-grade information density: 14px base, compact
   rows, but 20-24px padding inside cards and generous space between sections so
   the eye can rest.
5. **Empty states are first-class.** A brand-new wallet holds nothing. That state
   must look designed and intentional: it explains what will appear here and
   offers the one useful next action, rather than showing a broken chart.
6. **Mainnet honesty in the chrome.** A persistent network pill shows which chain
   the terminal is pointed at. On mainnet it reads "Arc" with a live green dot,
   because real funds are at stake.

## Layout

- **App bar** (sticky, 64px): logo + product name, nav (Spot, Perpetual,
  Portfolio), then on the right the network pill, search, notifications, wallet
  identity chip, theme toggle.
- **Portfolio page**: a 12-column grid.
  - Row 1: total wallet value (hero) with hide/reveal and refresh, wallet
    identity, allocation bar.
  - Row 2: four stat cards — Realized PnL, Win Rate, Volume, Trades.
  - Row 3: holdings table (left, wide) and the concentration meter (right).
  - Row 4: activity feed, full width, with a "View all" affordance.
- Cards use `rounded.lg`, hairline borders, and no drop shadows except on
  overlays, keeping the surface flat and precise.

## Components

- **Stat card**: label (12px, letter-spaced, muted) above value (mono, 24px).
  Optional delta chip. Border-only emphasis for the primary stat.
- **Holdings row**: token icon, symbol + name, balance (mono), price (mono,
  muted), value (mono, strong), share bar. Hover reveals a subtle row tint.
- **Allocation bar**: a single 8px rounded track split into segments, one per
  asset, in a muted-to-accent ramp; legend below with amount and percentage.
- **Concentration meter**: a horizontal segmented gauge showing the share of
  value in the largest single asset, labelled with real thresholds
  (Concentrated / Balanced / Diversified). This replaces any decorative risk
  slider.
- **Activity row**: type glyph (swap arrows vs transfer arrow), one-line summary
  ("Swapped 250.00 USDC to 229.60 EURC"), relative time, and an external-link
  affordance to the Arc explorer. Swaps and transfers are visually distinct.
- **Buttons**: primary = ember fill, white text, 12px radius; secondary =
  transparent with hairline border; tertiary = text with hover tint. Never more
  than one primary action per card.
- **Network pill**: small rounded pill with a status dot: "Arc" (green, mainnet)
  or "Arc Testnet" (muted).

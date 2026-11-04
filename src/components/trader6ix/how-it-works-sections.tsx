import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ARC_CHAIN_NAME } from "@/lib/arc-network";
import { CTA, Eyebrow, StatusChip, type Status } from "./sections";

/* How it works — a product walkthrough. Everything here is labelled live,
 * in development or planned against what the codebase actually supports; no
 * screenshots, numbers or market data are shown. */

function Step({
  n,
  title,
  lead,
  children,
}: {
  n: number;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="hw-step" aria-labelledby={`hw-${n}`}>
      <div className="hw-step-head">
        <span className="hw-num" aria-hidden="true">
          {String(n).padStart(2, "0")}
        </span>
        <div>
          <h2 id={`hw-${n}`}>{title}</h2>
          <p>{lead}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function HowHero() {
  const flow = ["Choose a market", "Analyse", "Define risk", "Execute", "Manage"];
  return (
    <section className="features-hero hw-hero">
      <div className="site-container features-hero-copy">
        <Eyebrow>How it works</Eyebrow>
        <h1>From Market To Position, In One Terminal.</h1>
        <p>
          Onchain trading shouldn&apos;t feel like a compromise. Trader6ix follows the workflow
          traders already know, then handles the infrastructure underneath. Built on{" "}
          {ARC_CHAIN_NAME}, and still being built.
        </p>
        <ol className="hw-flow" aria-label="Trading workflow">
          {flow.map((f, i) => (
            <li key={f}>
              <span>{i + 1}</span>
              {f}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const MARKETS: [string, string, Status][] = [
  ["Spot swaps", `Tower Exchange on ${ARC_CHAIN_NAME}`, "live"],
  ["Crypto and FX perpetuals", "Hibachi", "building"],
  ["Stablecoin markets", "USDC, EURC and cirBTC on Arc mainnet", "live"],
  ["FX spot markets", "Not yet available", "planned"],
];

export function HowSteps() {
  return (
    <div className="site-container hw-steps">
      <Step
        n={1}
        title="One terminal, multiple markets"
        lead="The goal is crypto and FX perpetuals, crypto and FX spot markets, stablecoin markets and decentralized liquidity in a single place, so you aren't juggling a different app for each."
      >
        <ul className="hw-tiles">
          {MARKETS.map(([name, detail, status]) => (
            <li className="t6c-card hw-tile" key={name}>
              <StatusChip status={status} />
              <h3>{name}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ul>
      </Step>

      <Step
        n={2}
        title="Choose your market"
        lead="Two kinds of market, each backed by its own infrastructure. You pick the market; the terminal deals with the venue."
      >
        <div className="t6c-grid t6c-grid-2 hw-tight">
          <article className="t6c-card">
            <div className="t6c-card-top">
              <span className="t6c-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/hibachi-logo.png" alt="" className="t6c-logo" />
                Hibachi
              </span>
              <StatusChip status="building" />
            </div>
            <h3>Perpetuals</h3>
            <p>
              Hibachi is the perpetuals infrastructure behind Trader6ix, so the terminal can focus
              on charts, execution, positions, leverage and risk. The integration is still being
              connected, and perpetual trading is not live yet.
            </p>
          </article>
          <article className="t6c-card">
            <div className="t6c-card-top">
              <span className="t6c-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/tower-logo.jpg" alt="" className="t6c-logo" />
                Tower Exchange
              </span>
              <StatusChip status="live" />
            </div>
            <h3>Spot swaps</h3>
            <p>
              Swap stablecoins and cirBTC on {ARC_CHAIN_NAME} through Tower Exchange. You see the
              route, rate and minimum received before you sign, and every swap is signed from your
              own wallet.
            </p>
          </article>
        </div>
      </Step>

      <Step
        n={3}
        title="Analyse the market"
        lead="The analysis workflow follows the layout traders know from MetaTrader and centralized exchanges."
      >
        <ol className="hw-list">
          <li>
            <strong>Pick a market</strong> from a searchable list grouped by Forex, Crypto and
            Commodities.
          </li>
          <li>
            <strong>Read the chart</strong> with candlesticks, timeframes from M1 to W1 and a moving
            average.
          </li>
          <li>
            <strong>Check price and spread</strong> in the chart header before you decide.
          </li>
        </ol>
        <p className="hw-note">
          The charting terminal is a preview for now: it runs on placeholder data until the Hibachi
          integration goes live.
        </p>
      </Step>

      <Step
        n={4}
        title="Manage risk before you trade"
        lead="Trader6ix doesn't just tell you “you are risking 2%”. It works out the position size that matches the risk you chose."
      >
        <div className="hw-risk" role="group" aria-label="Risk-based position sizing">
          <div className="hw-risk-col">
            <h3>You enter</h3>
            <ul>
              <li>Account balance</li>
              <li>Risk percentage</li>
              <li>Entry price</li>
              <li>Stop-loss</li>
            </ul>
          </div>
          <ArrowRight className="hw-risk-arrow" aria-hidden="true" />
          <div className="hw-risk-col hw-risk-mid">
            <h3>It calculates</h3>
            <ul>
              <li>
                Risk amount <code>balance × risk %</code>
              </li>
              <li>
                Stop distance <code>|entry − stop|</code>
              </li>
              <li>
                Size <code>risk amount ÷ stop distance</code>
              </li>
            </ul>
          </div>
          <ArrowRight className="hw-risk-arrow" aria-hidden="true" />
          <div className="hw-risk-col hw-risk-out">
            <h3>You get</h3>
            <ul>
              <li>Position size, in lots</li>
              <li>Sized with USD as the base</li>
            </ul>
          </div>
        </div>
        <div className="t6c-grid t6c-grid-2 hw-tight">
          <article className="t6c-card">
            <h3>Why lots, not coins</h3>
            <p>
              Sizing is normalised around USD, so the answer stays in lots across markets instead of
              making you think in BTC, ETH or SOL quantities.
            </p>
          </article>
          <article className="t6c-card">
            <h3>Leverage mode</h3>
            <p>
              Traders from crypto think in 5x, 10x or 20x, so there&apos;s a separate leverage
              workflow. It shows the resulting position exposure and your actual account risk,
              because leverage on its own isn&apos;t the risk.
            </p>
          </article>
        </div>
        <p className="hw-note">
          <StatusChip status="building" /> The sizing calculator is in development and runs on
          preview data in the Perps terminal today.
        </p>
      </Step>

      <Step
        n={5}
        title="Execute and manage"
        lead="Four steps from idea to open position, all in one interface."
      >
        <ol className="hw-cards">
          {[
            ["Choose a market", "Select it from the list."],
            ["Define your risk", "Set size, stop-loss and take-profit."],
            ["Execute", "Review the order and sign it from your wallet."],
            ["Manage", "Track open positions and close them when you decide to."],
          ].map(([t, d], i) => (
            <li className="t6c-card" key={t}>
              <span className="hw-card-n">{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
        <p className="hw-note">
          <StatusChip status="live" /> Spot swaps run end to end today.{" "}
          <StatusChip status="building" /> Perpetual orders and position management arrive with the
          Hibachi integration.
        </p>
      </Step>

      <Step
        n={6}
        title="The infrastructure underneath"
        lead="You shouldn't have to understand the infrastructure behind every trade. Trader6ix keeps it modular, so new providers can be added without rebuilding the terminal around one protocol."
      >
        <div className="hw-arch" role="group" aria-label="Adapter architecture">
          <div className="hw-arch-col">
            <span className="hw-arch-label">Terminal</span>
            <div className="t6c-card hw-arch-box">Charts, orders, positions, risk</div>
          </div>
          <ArrowRight className="hw-risk-arrow" aria-hidden="true" />
          <div className="hw-arch-col">
            <span className="hw-arch-label">Adapters</span>
            <div className="t6c-card hw-arch-box">Perpetuals</div>
            <div className="t6c-card hw-arch-box">Spot</div>
            <div className="t6c-card hw-arch-box">FX</div>
          </div>
          <ArrowRight className="hw-risk-arrow" aria-hidden="true" />
          <div className="hw-arch-col">
            <span className="hw-arch-label">Providers</span>
            <div className="t6c-card hw-arch-box">
              Hibachi <StatusChip status="building" />
            </div>
            <div className="t6c-card hw-arch-box">
              Tower Exchange <StatusChip status="live" />
            </div>
            <div className="t6c-card hw-arch-box">
              More <StatusChip status="planned" />
            </div>
          </div>
        </div>
      </Step>

      <Step
        n={7}
        title="Why Arc"
        lead={`Stablecoins are increasingly becoming financial infrastructure, and ${ARC_CHAIN_NAME} is an interesting foundation for applications built around stablecoin-native financial activity.`}
      >
        <article className="t6c-card hw-arc">
          <p>
            Trader6ix is exploring what that looks like applied to professional trading: stablecoins
            like USDC and EURC at the centre of the experience, with settlement and liquidity
            onchain.
          </p>
        </article>
      </Step>

      <section className="hw-next" aria-labelledby="hw-next">
        <h2 id="hw-next">Where it&apos;s headed</h2>
        <p>
          Advanced order types, portfolio analytics, watchlists, alerts, multi-wallet support,
          AI-assisted insights and more market integrations are planned. None of these are live
          today. <Link href="/">See the full status on the home page.</Link>
        </p>
      </section>
    </div>
  );
}

export function HowCTA() {
  return (
    <div className="site-container features-cta">
      <CTA connect />
    </div>
  );
}

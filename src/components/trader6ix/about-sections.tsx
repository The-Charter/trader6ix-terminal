"use client";

import Link from "next/link";
import { ArrowUpRight, Unplug, Telescope, SquareChartGantt, FileTerminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, CTA } from "./sections";
import { ARC_CHAIN_NAME } from "@/lib/arc-network";
import payout from "@/assets/about-payout.png.asset.json";
import watchlist from "@/assets/about-watchlist.png.asset.json";
import platforms from "@/assets/about-platforms.png.asset.json";

const summary =
  "One terminal for crypto and FX markets and onchain liquidity, built around how traders already work.";

function AboutHeading({ badge, children }: { badge: string; children: React.ReactNode }) {
  return (
    <div className="about-heading">
      <Eyebrow>{badge}</Eyebrow>
      <h2>{children}</h2>
      <p>{summary}</p>
    </div>
  );
}

export function AboutHero() {
  return (
    <section className="about-hero">
      <div className="site-container about-hero-content">
        <Eyebrow>About Trader6ix</Eyebrow>
        <h1>Onchain Trading Shouldn’t Feel Like A Compromise.</h1>
        <p>
          Trader6ix is a trader-focused terminal bringing multiple markets and onchain liquidity
          into one professional trading environment, with the workflow traders already know from
          MetaTrader and centralized exchanges.
        </p>
      </div>
    </section>
  );
}

export function AboutMission() {
  return (
    <section className="about-mission">
      <div className="site-container about-section-content">
        <div className="about-mission-copy">
          <h2>
            What We&apos;re <span>Building</span>
          </h2>
          <p>
            The vision is crypto and FX perpetuals, crypto and FX spot markets, stablecoin markets
            and decentralized liquidity in one terminal. Perpetuals are built around Hibachi; spot
            liquidity comes from Tower Exchange today, with Curve Finance in development. Separate
            adapters for each market mean new venues plug in without rebuilding the terminal, and
            the trader never has to understand the infrastructure underneath a trade. Built on{" "}
            {ARC_CHAIN_NAME}, where stablecoins are becoming financial infrastructure. The product is
            still being built, and the direction is clear: the professional trading experience
            traders already understand, with the liquidity, settlement and composability of onchain
            markets.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AboutProcess() {
  const steps = [
    {
      title: "1. Connect Your Wallet",
      description: `Connect your own wallet on ${ARC_CHAIN_NAME}. There is no account or password to create.`,
      Icon: Unplug,
    },
    {
      title: "2. Explore the Markets",
      description:
        "Choose a crypto or FX market and analyze it with live prices, candlestick charts and order books.",
      Icon: Telescope,
    },
    {
      title: "3. Plan Your Trade",
      description:
        "Define your risk: entry, stop-loss and take-profit set the position size, in lots or through leverage mode.",
      Icon: SquareChartGantt,
    },
    {
      title: "4. Execute With Confidence",
      description:
        "Execute, then manage the position and track your portfolio from the same interface. Spot is live today; perpetuals are in development.",
      Icon: FileTerminal,
    },
  ];
  return (
    <section className="about-process site-container">
      <AboutHeading badge="How It Works">
        The <span>Process</span>
      </AboutHeading>
      <div className="about-steps">
        {steps.map(({ title, description, Icon }) => (
          <article key={title}>
            <span className="round-icon">
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AboutBenefits() {
  return (
    <section className="about-benefits">
      <div className="site-container about-section-content">
        <AboutHeading badge="Why Trader6ix">
          What You <span>Get</span>
        </AboutHeading>
        <div className="about-benefit-grid">
          <article className="about-benefit-small">
            <div>
              <h3>Real-Time Market Access</h3>
              <p>
                Live prices, charts and order books across crypto and FX markets, in one terminal.
              </p>
            </div>
            <img
              className="about-benefit-art t6-mono"
              src={payout.url}
              alt="Illustrative integrations graphic"
              loading="lazy"
            />
          </article>
          <article className="about-benefit-small">
            <div>
              <h3>Risk-Based Position Sizing</h3>
              <p>
                Calculate position sizes, estimate margin, set stop-loss levels, and evaluate
                risk-to-reward ratios before placing a trade.
              </p>
            </div>
            <img
              className="about-benefit-art about-watchlist"
              src={watchlist.url}
              alt="Trading platform market watchlist"
              loading="lazy"
            />
          </article>
          <article className="about-benefit-platform">
            <div>
              <h3>Unified Trading Experience</h3>
              <p>
                Trader6ix brings charts, order books, portfolio tracking, risk-management tools, and
                trade execution together in one secure, non-custodial experience so you can analyze
                markets and manage positions without switching between platforms.
              </p>
            </div>
            <img
              className="about-platform-art"
              src={platforms.url}
              alt="Illustrative market listing"
              loading="lazy"
            />
          </article>
        </div>
      </div>
    </section>
  );
}

export function AboutCTA() {
  return (
    <div className="site-container about-cta">
      <CTA />
    </div>
  );
}

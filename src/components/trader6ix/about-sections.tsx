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
  "Our Unified Trading Terminal Is Transforming the Way People Analyze Markets and Execute Trades.";

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
        <Eyebrow>Introducing our Insights</Eyebrow>
        <h1>We’re Making Multi-Asset Trading Simpler, Faster, and More Accessible.</h1>
        <p>
          Shape your trading strategy effortlessly with Trader6ix’s unified dashboard, powered by
          real-time data, advanced analytics, and risk-management tools at your fingertips.
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
            What We <span>Do?</span>
          </h2>
          <p>
            Trader6ix is building an all-in-one trading terminal for crypto and FX markets, bringing
            spot swaps, perpetual futures, real-time market data, charts, order books, portfolio
            tracking, and risk-management tools into one streamlined experience. Built on Arc
            Testnet, the platform gives traders a simpler way to connect their wallet, explore
            markets, manage positions, and execute trades without switching between multiple
            platforms. Whether you’re analyzing price action, calculating position size, monitoring
            portfolio activity, or testing new strategies, Trader6ix provides the tools and insights
            needed to trade with greater clarity and confidence.
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
      description: `Access Trader6ix in minutes by connecting your wallet to ${ARC_CHAIN_NAME} or signing in with your preferred login method.`,
      Icon: Unplug,
    },
    {
      title: "2. Explore the Markets",
      description:
        "Review live market data, candlestick charts, order books, and available crypto or FX instruments from one unified terminal.",
      Icon: Telescope,
    },
    {
      title: "3. Plan Your Trade",
      description:
        "Use the risk calculator and trading tools to define your position size, leverage, stop-loss, take-profit, and overall strategy.",
      Icon: SquareChartGantt,
    },
    {
      title: "4. Execute With Confidence",
      description:
        "Place spot or perpetual trades, monitor your positions, and track your portfolio from a streamlined trading dashboard.",
      Icon: FileTerminal,
    },
  ];
  return (
    <section className="about-process site-container">
      <AboutHeading badge="Introducing our Insights">
        The <span>Processed</span>
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
        <AboutHeading badge="Our Features">
          Our <span>Benefit</span>
        </AboutHeading>
        <div className="about-benefit-grid">
          <article className="about-benefit-small">
            <div>
              <h3>Real-Time Market Access</h3>
              <p>
                Monitor live prices, charts, order books, and trading opportunities from one
                powerful terminal.
              </p>
            </div>
            <img
              className="about-benefit-art"
              src={payout.url}
              alt="Cryptocurrency payout network"
              loading="lazy"
            />
          </article>
          <article className="about-benefit-small">
            <div>
              <h3>Advanced Risk Management</h3>
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
              alt="Multi-asset investment platform showing bond listings"
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
      <CTA connect />
    </div>
  );
}

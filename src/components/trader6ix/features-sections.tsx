"use client";

import { useState } from "react";
import { Workflow, PanelsTopLeft, Gauge, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, CTA } from "./sections";
import { ARC_CHAIN_NAME } from "@/lib/arc-network";
import technicals from "@/assets/features-technicals.png.asset.json";
import watchlist from "@/assets/features-watchlist.png.asset.json";
import account from "@/assets/features-account.png.asset.json";
import platform from "@/assets/features-platform.png.asset.json";
import monitoring from "@/assets/features-monitoring.png.asset.json";
import analytics from "@/assets/features-analytics.png.asset.json";
import performance from "@/assets/features-performance.png.asset.json";
import feedback from "@/assets/features-feedback.png.asset.json";

export function FeaturesHero() {
  return (
    <section className="features-hero">
      <div className="site-container features-hero-copy">
        <Eyebrow>Features</Eyebrow>
        <h1>Everything A Trader Needs. One Terminal.</h1>
        <p>
          Connect your wallet, choose a market, analyze the chart, size the position from your
          risk, then execute and manage it, all from one interface on {ARC_CHAIN_NAME}. Spot swaps
          are live today; perpetuals and risk-based sizing are in development.
        </p>
      </div>
    </section>
  );
}

export function FeaturesBenefits() {
  return (
    <section className="features-benefits site-container">
      <div className="features-heading">
        <h2>
          Built Around <span>The Trader</span>
        </h2>
        <p>The terminal handles the infrastructure underneath, so you can focus on the trade.</p>
      </div>
      <div className="features-benefit-grid">
        <article className="features-payout">
          <div className="features-card-content">
            <h3>Real-Time Market Access</h3>
            <p>
              Live prices, charts and order books across crypto and FX markets, in one terminal.
            </p>
          </div>
          <img
            className="features-technicals t6-mono"
            src={technicals.url}
            alt="Technical analysis gauge showing a buy signal"
            loading="lazy"
          />
        </article>
        <article className="features-conditions">
          <div className="features-card-content">
            <h3>Risk-Based Position Sizing</h3>
            <p>
              Enter your balance, risk, entry and stop-loss, and Trader6ix sizes the position in
              lots, normalised around USD. Leverage mode shows the exposure and the actual account
              risk.
            </p>
          </div>
          <img
            className="features-watchlist"
            src={watchlist.url}
            alt="Market watchlist with index prices and daily changes"
            loading="lazy"
          />
        </article>
        <article className="features-platform">
          <div className="features-card-content">
            <h3>Unified Trading Experience</h3>
            <p>
              Trader6ix brings charts, order books, portfolio tracking, risk-management tools, and
              trade execution together in one secure, non-custodial experience so you can analyze
              markets and manage positions without switching between platforms.
            </p>
          </div>
          <img
            className="features-platform-image"
            src={platform.url}
            alt="Illustrative market listing"
            loading="lazy"
          />
          <img
            className="features-account-image"
            src={account.url}
            alt="Illustrative earnings card"
            loading="lazy"
          />
        </article>
      </div>
    </section>
  );
}

const dashboardTabs = [
  { label: "Market Monitoring", Icon: Workflow, image: monitoring.url },
  { label: "Trading Analytics", Icon: PanelsTopLeft, image: analytics.url },
  { label: "Portfolio Performance", Icon: Gauge, image: performance.url },
  { label: "Market Screener", Icon: MessageSquare, image: feedback.url },
];

export function FeaturesSolutions() {
  const [selected, setSelected] = useState(0);
  const active = dashboardTabs[selected] ?? dashboardTabs[0];
  return (
    <section className="features-solutions">
      <div className="site-container features-solutions-content">
        <div className="features-heading">
          <h2>
            Powerful Tools for <span>Smarter Trading</span>
          </h2>
          <p>
            Analyze markets, manage risk and execute from one terminal, built to help you trade
            with clarity and confidence. Previews below are illustrative.
          </p>
        </div>
        <div className="features-dashboard-tabs" role="tablist" aria-label="Dashboard features">
          {dashboardTabs.map(({ label, Icon }, index) => (
            <Button
              key={label}
              id={`features-tab-${index}`}
              role="tab"
              aria-selected={selected === index}
              aria-controls="features-dashboard-panel"
              variant={selected === index ? "orange" : "neutral"}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next =
                    (index + (event.key === "ArrowRight" ? 1 : -1) + dashboardTabs.length) %
                    dashboardTabs.length;
                  setSelected(next);
                  document.getElementById(`features-tab-${next}`)?.focus();
                }
              }}
              tabIndex={selected === index ? 0 : -1}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
        <div
          className="features-dashboard-panel"
          id="features-dashboard-panel"
          role="tabpanel"
          aria-labelledby={`features-tab-${selected}`}
        >
          <img
            className="t6-mono"
            src={active?.image}
            alt={`${active?.label} dashboard showing market performance and trading volume`}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export function FeaturesCTA() {
  return (
    <div className="site-container features-cta">
      <CTA />
    </div>
  );
}

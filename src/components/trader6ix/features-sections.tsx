"use client";

import { useState } from "react";
import { Workflow, PanelsTopLeft, Gauge, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, CTA, CountUp } from "./sections";
import { images } from "@/assets/images";
import hero from "@/assets/about-hero.png.asset.json";
import cardGlow from "@/assets/about-card-glow.png.asset.json";
import technicals from "@/assets/features-technicals.png.asset.json";
import watchlist from "@/assets/features-watchlist.png.asset.json";
import account from "@/assets/features-account.png.asset.json";
import platform from "@/assets/features-platform.png.asset.json";
import solutionsBackdrop from "@/assets/features-solutions-bg.png.asset.json";
import monitoring from "@/assets/features-monitoring.png.asset.json";
import analytics from "@/assets/features-analytics.png.asset.json";
import performance from "@/assets/features-performance.png.asset.json";
import feedback from "@/assets/features-feedback.png.asset.json";

function Backdrop({ src }: { src: string }) {
  return <img className="features-backdrop" src={src} alt="" aria-hidden="true" />;
}

export function FeaturesHero() {
  return (
    <section className="features-hero">
      <Backdrop src={hero.url} />
      <div className="site-container features-hero-copy">
        <Eyebrow>Features</Eyebrow>
        <h1>All Your Trading. In One Place.</h1>
        <p>
          Trader6ix brings the complete trading workflow together. From wallet connection and
          real-time market data to risk management, trade execution, portfolio tracking, and
          seamless on-chain settlement on Arc Testnet.
        </p>
      </div>
    </section>
  );
}

export function FeaturesSuccess() {
  const stats = [
    ["50+", "Tradable Assets"],
    ["10K+", "Market Signals"],
    ["1.2K+", "Active Traders"],
    ["50K+", "Simulated Trades"],
    ["$25M+", "Demo Volume"],
  ] as const;
  return (
    <section className="features-success site-container">
      <div className="stats">
        {stats.map(([value, label]) => (
          <div className="stat" key={label}>
            <CountUp value={value} />
            <p>{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturesBenefits() {
  return (
    <section className="features-benefits site-container">
      <div className="features-heading">
        <h2>
          Trade Against <span>And More</span>
        </h2>
        <p>Our Financial Management Platform Is Transforming The Way People Manage Their Money.</p>
      </div>
      <div className="features-benefit-grid">
        <article className="features-payout">
          <Backdrop src={cardGlow.url} />
          <div className="features-card-content">
            <h3>Real-Time Market Access</h3>
            <p>
              Monitor live prices, charts, order books, and trading opportunities from one powerful
              terminal.
            </p>
          </div>
          <img
            className="features-technicals"
            src={technicals.url}
            alt="Technical analysis gauge showing a buy signal"
            loading="lazy"
          />
        </article>
        <article className="features-conditions">
          <Backdrop src={cardGlow.url} />
          <div className="features-card-content">
            <h3>Advanced Risk Management</h3>
            <p>
              Calculate position sizes, estimate margin, set stop-loss levels, and evaluate
              risk-to-reward ratios before placing a trade.
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
          <Backdrop src={images[3] ?? ""} />
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
            alt="Trading platform listing bonds and yields to maturity"
            loading="lazy"
          />
          <img
            className="features-account-image"
            src={account.url}
            alt="ASIX account earnings insight"
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
  { label: "Trader Feedback", Icon: MessageSquare, image: feedback.url },
];

export function FeaturesSolutions() {
  const [selected, setSelected] = useState(0);
  const active = dashboardTabs[selected] ?? dashboardTabs[0];
  return (
    <section className="features-solutions">
      <Backdrop src={solutionsBackdrop.url} />
      <div className="site-container features-solutions-content">
        <div className="features-heading">
          <h2>
            Powerful Tools for <span>Smarter Trading</span>
          </h2>
          <p>
            Analyze markets, manage risk, and execute trades effortlessly with Trader6ix’s unified
            dashboard—built with everything you need to trade with greater clarity and confidence.
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
      <CTA to="/auth" />
    </div>
  );
}

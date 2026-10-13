"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ARC_CHAIN_NAME, IS_ARC_MAINNET } from "@/lib/arc-network";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  ChartCandlestick,
  ChevronUp,
  Play,
  SquareChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { images } from "@/assets/images";
import { partners } from "@/assets/partners";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="eyebrow">
      {children}
      <ArrowRight />
    </span>
  );
}
export function Hero() {
  return (
    <section className="hero">
      {/* Background and candlestick artwork hidden — plain black hero for now.
      <img className="hero-bg" src={images[0]} alt="" />
      <img className="hero-bg hero-candles" src={images[1]} alt="" />
      */}
      <div className="hero-inner site-container">
        <div className="hero-copy">
          <Eyebrow>Real-Time Trading Intelligence</Eyebrow>
          <h1>
            Analyze Better.
            <br />
            Trade Faster.
          </h1>
          <p>
            Everything you need to analyze markets, manage positions, and trade crypto with maximum
            precision.
          </p>
          <div className="hero-actions">
            <Button variant="hero" size="hero" asChild>
              <Link href="/auth">
                Get Started <ArrowUpRight />
              </Link>
            </Button>
            <Button variant="orange" size="hero" asChild>
              <Link href="/features">
                <Play fill="currentColor" /> How it works
              </Link>
            </Button>
          </div>
        </div>
        {/* Side dashboard card hidden for now.
        <img
          className="hero-card"
          src={images[2]}
          alt="Trader6ix live trading dashboard showing crypto staking rewards and market performance"
        />
        */}
      </div>
    </section>
  );
}
export function CountUp({ value }: { value: string }) {
  const m = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const raw = m?.[2];
  const num = raw !== undefined ? parseFloat(raw) : null;
  // Preserve the source value's decimal places so "1.2K" counts through 0.4K,
  // 0.9K… instead of jumping on the integer part alone.
  const decimals = raw !== undefined ? (raw.split(".")[1]?.length ?? 0) : 0;
  const ref = useRef<HTMLElement>(null);
  const [text, setText] = useState(num === null || !m ? value : (0).toFixed(decimals));
  useEffect(() => {
    if (num === null) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let running = false;
    const stop = () => {
      cancelAnimationFrame(raf);
      running = false;
    };
    // Restarts from zero on every entry, so the count replays whichever
    // direction the section is scrolled from — not just on first load.
    const play = () => {
      if (running) return;
      running = true;
      setText((0).toFixed(decimals));
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        setText((num * (1 - Math.pow(1 - p, 3))).toFixed(decimals));
        if (p < 1) raf = requestAnimationFrame(tick);
        else running = false;
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) play();
          else stop();
        }
      },
      { threshold: 0.7 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [num, decimals]);
  return <strong ref={ref}>{m ? m[1] + text + m[3] : value}</strong>;
}
export function Trust() {
  return (
    <section className="trust site-container">
      <div className="stats">
        {(
          [
            ["50+", "Tradable Assets"],
            ["10K+", "Market Signals"],
            ["1.2K+", "Active Traders"],
            ["50K+", "Simulated Trades"],
            ["$25M+", "Demo Volume"],
          ] as const
        ).map(([v, l]) => (
          <div className="stat" key={l}>
            <CountUp value={v} />
            <p>{l}</p>
          </div>
        ))}
      </div>
      <div className="partners">
        <p>Trusted By 240+ Companies</p>
        <div className="partner-logos">
          <div className="partner-track">
            {[0, 1].map((copy) => (
              <div className="partner-set" key={copy} aria-hidden={copy === 1}>
                {partners.map((src, i) => (
                  <img key={i} src={src} alt={copy === 0 ? "Logoipsum partner" : ""} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export function WhyChooseUs() {
  const reasons = [
    [
      "Real-Time Market Insights",
      "Stay informed with live market data, order books, price charts, and portfolio updates — all brought together in one streamlined trading terminal for faster, more confident decisions.",
      Brain,
    ],
    [
      "One Terminal, Every Opportunity",
      "Trade spot markets and perpetuals from one streamlined interface. Monitor prices, analyze charts, manage positions, and execute trades without switching between multiple platforms.",
      SquareChevronRight,
    ],
    [
      "Non-Custodial Trading",
      "Trade with confidence while keeping control of your assets. Connect your wallet, review every transaction, and sign trades directly on Arc without handing your funds to a centralized platform.",
      ChartCandlestick,
    ],
  ] as const;
  return (
    <section className="why">
      <div className="split-heading">
        <h2 className="section-heading">Why Choose Us</h2>
        <p>Backed By A Suite Of Powerful Tools At Your Fingertips.</p>
      </div>
      <div className="why-list">
        {reasons.map(([title, desc, Icon], i) => (
          <div className="why-row" key={title}>
            <span className="why-number">0{i + 1}</span>
            <h3>{title}</h3>
            <div className="why-description">
              <span className="round-icon">
                <Icon />
              </span>
              <p>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "in">("idle");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setState("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={state === "idle" ? undefined : `reveal ${state === "in" ? "is-in" : ""}`}
    >
      {children}
    </div>
  );
}
export function Features() {
  return (
    <section className="section features">
      <div className="center-heading">
        <Eyebrow>Our Features</Eyebrow>
        <h2 className="section-heading">
          Our Powerfull Dashboard Enable Over 234.000 Analytics Everyday
        </h2>
      </div>
      <div className="feature-grid">
        <article className="feature-card">
          <h3>Real-time Market Insight</h3>
          <p>
            At Trader6ix, We Ensure Fast, Reliable Payouts With Robust Model And Verified Proof On
            Blockchain And Social Media.
          </p>
          <img src={images[4]} className="feature-art" alt="Real-time market analytics dashboard" />
        </article>
        <article className="feature-card">
          <h3>Advanced Account Analysis</h3>
          <p>Customize Your Business Journey Effortlessly With Trader6ix Dashboard</p>
          <img src={images[6]} className="feature-art" alt="Account transactions and analysis" />
          <img src={images[5]} className="feature-float" alt="ASIX account insights" />
        </article>
        <article className="feature-card">
          <h3>Portofolio Management</h3>
          <p>Easily Tweak Your Business Journey With Trader6ix's Dashboard!</p>
          <img src={images[8]} className="feature-art" alt="Portfolio market watchlist" />
        </article>
        <article className="feature-card">
          <h3>Advanced Charting Tools</h3>
          <p>
            At Blue Guardian, We Ensure Fast, Reliable Payouts With Robust Model And Verified Proof
            On Blockchain And Social Media.
          </p>
          <img
            src={images[7]}
            className="feature-art"
            alt="Advanced cryptocurrency candlestick chart"
          />
        </article>
      </div>
    </section>
  );
}
const names = [
  "Colin Hamill",
  "Jonathon Friesen",
  "Yvonne Baumbach",
  "Carole Kiehn",
  "Liam Everhart",
  "Carmen Waters",
];
const quotes = [
  "Using the Trader6ix system has enhanced our payment operations greatly. Each transaction runs smoothly now, bringing measurable growth in daily performance.",
  "With Trader6ix technology, our business functions have improved noticeably. Processes are seamless today, and we’ve gained outstanding results in time management.",
  "The Trader6ix platform has revolutionized our transaction processes. Everything flows seamlessly now, and we've experienced remarkable gains in operational efficiency.",
];
export function Testimonials() {
  const rows = [names.slice(0, 3), names.slice(3)];
  return (
    <section className="section testimonials">
      <Eyebrow>Testimonials</Eyebrow>
      <div className="split-heading">
        <h2 className="section-heading">What Traders Think About Trader6ix</h2>
        <p>
          A Smarter Way to Analyze Markets and Execute Trades. Here’s What Traders Are Saying About
          Their Trader6ix Experience
        </p>
      </div>
      <div className="review-rows">
        {rows.map((row, r) => {
          const items = [...row, ...row, ...row];
          return (
            <div className={`review-marquee ${r === 1 ? "reverse" : ""}`} key={r}>
              <div className="review-track">
                {items.map((name, k) => {
                  const i = names.indexOf(name);
                  return (
                    <article className="review" key={`${name}-${k}`} aria-hidden={k >= row.length}>
                      <div className="review-person">
                        <img src={images[9 + i]} alt={name} />
                        <div>
                          <strong>{name}</strong>
                          <div className="review-stars" aria-label="5 out of 5 stars">
                            ★★★★★
                          </div>
                        </div>
                      </div>
                      <p>“{quotes[i % 3]}”</p>
                      <time dateTime="2024-06-10">
                        June {i === 2 ? "09" : i === 4 ? "12" : "10"}, 2024
                      </time>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
export const faqItems = [
  [
    "What is Trader6ix?",
    "Trader6ix is an all-in-one trading terminal for crypto and FX markets. It brings market data, charts, order books, risk-management tools, portfolio tracking, spot swaps, and perpetual trading into one streamlined interface.",
  ],
  [
    "Which markets can I trade on Trader6ix?",
    "Trader6ix is designed to support crypto assets, perpetual futures, stablecoin swaps, and FX markets. Available markets depend on the connected venue, the current integrations, and the network the terminal is pointed at.",
  ],
  [
    "Do I need to create a separate exchange account?",
    "Trader6ix uses wallet-based access through Privy. You can connect an existing wallet or create an embedded wallet, depending on your login method. Some external trading venues may still require additional account credentials for backend integrations.",
  ],
  [
    "Is Trader6ix safe to use?",
    `Trader6ix is designed around non-custodial wallet interactions. You review and sign blockchain transactions through your connected wallet rather than sharing your private key with the platform. ${
      IS_ARC_MAINNET
        ? "The terminal is connected to Arc mainnet, so a signed transaction moves real funds — every one is shown to you before it is submitted."
        : "The terminal is connected to Arc Testnet, where transactions use test assets and do not involve real funds."
    }`,
  ],
  [
    IS_ARC_MAINNET
      ? "Do trades on Trader6ix involve real funds?"
      : "Can I use Trader6ix without risking real money?",
    IS_ARC_MAINNET
      ? "Yes. Trader6ix is connected to Arc mainnet, so swaps settle in real USDC, EURC and cirBTC. Only trade funds you can afford to risk."
      : "Yes. Trader6ix is connected to Arc Testnet, where you can use testnet assets for experimentation and product testing.",
  ],
];
export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="faq">
      <div>
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="section-heading">Frequently Asked Questions</h2>
      </div>
      <div className="faq-list">
        {faqItems.map(([question, answer], i) => (
          <div className="faq-item" key={question}>
            <Button
              variant="ghost"
              className="faq-question"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              aria-controls={`faq-answer-${i}`}
            >
              {question}
              {open === i ? <Minus /> : <Plus />}
            </Button>
            {open === i && (
              <p id={`faq-answer-${i}`} className="faq-answer">
                {answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
export function CTA({ to = "/contact" }: { to?: string }) {
  return (
    <section className="cta">
      <img src={images[15]} className="cta-background" alt="" />
      <div className="cta-content">
        <Eyebrow>Introducing our Insights</Eyebrow>
        <h2>Trade Smarter From One Terminal</h2>
        <p>
          Connect your wallet in minutes and start exploring spot markets, perpetuals, real-time
          analytics, and risk-management tools on {ARC_CHAIN_NAME}.
        </p>
        <Button variant="hero" size="hero" asChild>
          <Link href={to}>
            Get Started <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      className="back-to-top from-down"
      aria-label="Back to top"
      onClick={() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      }}
    >
      <ChevronUp aria-hidden="true" />
    </button>
  );
}

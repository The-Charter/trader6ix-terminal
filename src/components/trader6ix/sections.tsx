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
import { ConnectWalletButton } from "@/components/trader6ix/connect-wallet-button";
import { images } from "@/assets/images";

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
      <div className="hero-inner site-container">
        <div className="hero-copy">
          <Eyebrow>Onchain trading, without the compromise</Eyebrow>
          <h1>
            A Professional
            <br />
            Trading Terminal.
          </h1>
          <p>
            Trader6ix brings multiple markets and onchain liquidity into one familiar trading
            environment: choose a market, analyze the chart, define your risk, execute, and manage
            the position from one interface. Built on {ARC_CHAIN_NAME}.
          </p>
          <div className="hero-actions">
            <ConnectWalletButton variant="hero" size="hero">
              Get Started <ArrowUpRight />
            </ConnectWalletButton>
            <Button variant="orange" size="hero" asChild>
              <Link href="/features">
                <Play fill="currentColor" /> How it works
              </Link>
            </Button>
          </div>
        </div>
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
type Status = "live" | "building" | "planned";
const STATUS_LABEL: Record<Status, string> = {
  live: "Live",
  building: "In development",
  planned: "Planned",
};
function StatusChip({ status }: { status: Status }) {
  return <span className={`t6c-chip t6c-chip-${status}`}>{STATUS_LABEL[status]}</span>;
}

/** Current integrations only: Hibachi and Tower Exchange. */
export function Integrations() {
  return (
    <section className="t6c-section" aria-labelledby="t6c-integrations">
      <div className="split-heading">
        <h2 className="section-heading" id="t6c-integrations">
          Current Integrations
        </h2>
        <p>The infrastructure Trader6ix is built around today.</p>
      </div>
      <div className="t6c-grid t6c-grid-2">
        <article className="t6c-card">
          <div className="t6c-card-top">
            <span className="t6c-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/hibachi-logo.png" alt="" className="t6c-logo" />
              Hibachi
            </span>
            <StatusChip status="building" />
          </div>
          <h3>Perpetuals infrastructure</h3>
          <p>
            Hibachi is the perpetuals infrastructure Trader6ix is building around, so the terminal
            can focus on charts, execution, positions, leverage and risk management. The
            integration is still being connected and perpetual trading is not live yet.
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
          <h3>Spot swap integration</h3>
          <p>
            Spot swaps on {ARC_CHAIN_NAME} route through Tower Exchange. On Arc mainnet they settle
            in USDC, EURC and cirBTC, signed from your own wallet.
          </p>
        </article>
      </div>
    </section>
  );
}

export function WhyChooseUs() {
  const reasons = [
    [
      "Familiar Trading Workflow",
      "Onchain trading shouldn't feel like a compromise. Trader6ix is designed around the workflow traders already know from platforms like MetaTrader and centralized exchanges: markets, charts, order entry, positions and risk in one place.",
      ChartCandlestick,
    ],
    [
      "One Terminal, Multiple Markets",
      "The goal is crypto and FX perpetuals, crypto and FX spot markets, stablecoin markets and decentralized liquidity in a single terminal. The trader shouldn't have to understand the infrastructure underneath every trade.",
      SquareChevronRight,
    ],
    [
      "Non-Custodial By Design",
      `Connect your wallet, review each transaction, and sign directly on ${ARC_CHAIN_NAME}. Trader6ix never takes custody of your funds.`,
      Brain,
    ],
  ] as const;
  return (
    <section className="why">
      <div className="split-heading">
        <h2 className="section-heading">What Trader6ix Is Building</h2>
        <p>A trader-focused terminal for onchain markets.</p>
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

export function Markets() {
  const rows: [string, string, Status][] = [
    [
      "Spot swaps",
      `Tower Exchange on ${ARC_CHAIN_NAME}${IS_ARC_MAINNET ? " mainnet" : ""}`,
      "live",
    ],
    ["Crypto and FX perpetuals", "Hibachi", "building"],
    ["Stablecoin markets", "USDC, EURC and cirBTC are the assets Tower routes on Arc mainnet today", "live"],
    ["FX spot markets", "Not yet available", "planned"],
    ["Additional decentralized liquidity", "More venues through the modular adapter layer", "planned"],
  ];
  return (
    <section className="t6c-section" aria-labelledby="t6c-markets">
      <div className="split-heading">
        <h2 className="section-heading" id="t6c-markets">
          Markets: Live Today And What&apos;s Next
        </h2>
        <p>Current functionality is labelled separately from planned capability.</p>
      </div>
      <ul className="t6c-rows">
        {rows.map(([name, detail, status]) => (
          <li className="t6c-row" key={name}>
            <span className="t6c-row-name">{name}</span>
            <span className="t6c-row-detail">{detail}</span>
            <StatusChip status={status} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RiskSizing() {
  return (
    <section className="t6c-section" aria-labelledby="t6c-risk">
      <div className="split-heading">
        <h2 className="section-heading" id="t6c-risk">
          Risk-Based Position Sizing
        </h2>
        <p>
          Not just &ldquo;you are risking 2%&rdquo;: the terminal works out the size that matches
          your risk.
        </p>
      </div>
      <div className="t6c-grid t6c-grid-2">
        <article className="t6c-card">
          <div className="t6c-card-top">
            <h3>Size from risk</h3>
            <StatusChip status="building" />
          </div>
          <p>
            Enter your account balance, risk percentage, entry and stop-loss. Trader6ix calculates
            the position size, normalised around USD so the result stays in lots across markets
            instead of forcing you to think in BTC, ETH or SOL quantities.
          </p>
        </article>
        <article className="t6c-card">
          <div className="t6c-card-top">
            <h3>Leverage mode</h3>
            <StatusChip status="building" />
          </div>
          <p>
            Traders from crypto think in 5x, 10x, 20x. Leverage mode accommodates that, showing the
            resulting position exposure and the actual account risk, because leverage on its own
            isn&apos;t the risk.
          </p>
        </article>
      </div>
    </section>
  );
}

export function ArchitectureArc() {
  return (
    <section className="t6c-section" aria-labelledby="t6c-arch">
      <div className="split-heading">
        <h2 className="section-heading" id="t6c-arch">
          Modular By Design, Built On Arc
        </h2>
        <p>Adapters keep the terminal independent of any single protocol.</p>
      </div>
      <div className="t6c-grid t6c-grid-2">
        <article className="t6c-card">
          <h3>Modular adapters</h3>
          <p>
            Perpetuals, FX and spot markets each sit behind their own adapter, so different
            execution and liquidity providers can be integrated without rebuilding the terminal
            around a single protocol.
          </p>
        </article>
        <article className="t6c-card">
          <h3>Why Arc</h3>
          <p>
            Stablecoins are increasingly becoming financial infrastructure, and Arc is an
            interesting foundation for applications built around stablecoin-native financial
            activity. Trader6ix is exploring what that looks like applied to professional trading.
          </p>
        </article>
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
  const items = [
    "Advanced order types",
    "Portfolio analytics",
    "Watchlists",
    "Alerts",
    "Multi-wallet support",
    "AI-assisted trading insights",
    "Additional market integrations",
  ];
  return (
    <section className="section features t6c-section" aria-labelledby="t6c-roadmap">
      <div className="split-heading">
        <h2 className="section-heading" id="t6c-roadmap">
          Where It&apos;s Headed
        </h2>
        <p>
          The longer-term goal is an onchain trading workstation. Everything below is planned or
          under development, and the product is still being built.
        </p>
      </div>
      <ul className="t6c-pills">
        {items.map((item) => (
          <li className="t6c-pill" key={item}>
            {item}
            <StatusChip status="planned" />
          </li>
        ))}
      </ul>
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
    "Trader6ix is a trader-focused terminal being built to bring crypto and FX markets and onchain liquidity into one familiar trading environment. Today it offers wallet-based access, portfolio tracking and spot swaps through Tower Exchange on Arc; perpetuals (via Hibachi), risk-based position sizing and more are in development.",
  ],
  [
    "Which markets can I trade on Trader6ix?",
    "The goal is crypto and FX perpetuals, crypto and FX spot markets, and stablecoin markets. Right now spot swaps are live through Tower Exchange on Arc; perpetuals are being connected to Hibachi and FX spot is planned. See the Markets section for the current status.",
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
/** `connect` makes "Get Started" open the wallet modal instead of linking to `to`. */
export function CTA({ to = "/contact", connect = false }: { to?: string; connect?: boolean }) {
  return (
    <section className="cta">
      <img src={images[15]} className="cta-background" alt="" />
      <div className="cta-content">
        <Eyebrow>Get started</Eyebrow>
        <h2>Onchain Trading Without The Compromise</h2>
        <p>
          Connect your wallet to swap on {ARC_CHAIN_NAME} through Tower Exchange today, with
          perpetuals and risk-based sizing on the way.
        </p>
        {connect ? (
          <ConnectWalletButton variant="hero" size="hero">
            Get Started <ArrowUpRight />
          </ConnectWalletButton>
        ) : (
          <Button variant="hero" size="hero" asChild>
            <Link href={to}>
              Get Started <ArrowUpRight />
            </Link>
          </Button>
        )}
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

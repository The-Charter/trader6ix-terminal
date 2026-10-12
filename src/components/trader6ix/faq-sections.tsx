"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Eyebrow, faqItems } from "./sections";
import { Button } from "@/components/ui/button";
import hero from "@/assets/about-hero.png.asset.json";

const categories = [
  {
    name: "General",
    // Same five questions and answers as the homepage FAQ (single source of truth).
    items: faqItems,
  },
  {
    name: "Privacy & Security",
    items: [
      [
        "Does Trader6ix have access to my private keys?",
        "No. Trader6ix is designed as a non-custodial platform. Your private keys remain with your connected wallet, and blockchain transactions are signed through your wallet provider before they are submitted to Arc Testnet.",
      ],
      [
        "How are my trades authorized?",
        "Trade and swap transactions require confirmation through your connected wallet. Trader6ix does not secretly execute blockchain transactions on your behalf. You can review and approve each transaction before it is signed and broadcast.",
      ],
      [
        "How are API credentials protected?",
        "Sensitive credentials for services such as Hibachi, Tower Exchange, and Circle StableFX are stored as server-side environment variables. They are accessed through protected Next.js API routes and are not exposed to the browser through public environment variables.",
      ],
      [
        "Is Trader6ix connected to real funds?",
        "Trader6ix is currently designed for Arc Testnet, where transactions use testnet assets with no real monetary value. Users should only connect test wallets and testnet funds while the platform and its integrations are being tested.",
      ],
    ],
  },
  {
    name: "Plans & Pricing",
    items: [["Is Trader6ix free to use?", "Trader6ix is 100% free to use."]],
  },
] as const;

export function FaqHero() {
  return (
    <section className="int-hero faqpage-hero">
      <img className="int-backdrop" src={hero.url} alt="" />
      <div className="site-container int-hero-content">
        <Eyebrow>FAQ</Eyebrow>
        <h1>Frequently asked questions</h1>
        <p>Get the lowdown on the most frequently asked questions about Trader6ix's platform!</p>
      </div>
    </section>
  );
}

export function FaqTabs() {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const active = categories[tab]!;
  return (
    <section className="site-container faqpage-tabs">
      <div className="faqpage-tablist" role="tablist" aria-label="FAQ categories">
        {categories.map((c, i) => (
          <Button
            key={c.name}
            variant="ghost"
            role="tab"
            aria-selected={tab === i}
            className={`faqpage-tab${tab === i ? " is-active" : ""}`}
            onClick={() => {
              setTab(i);
              setOpen(0);
            }}
          >
            {c.name}
          </Button>
        ))}
      </div>
      <div className="faqpage-list" role="tabpanel">
        {active.items.map(([question, answer], i) => (
          <div className="faq-item" key={question}>
            <Button
              variant="ghost"
              className="faq-question"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              aria-controls={`faqpage-answer-${i}`}
            >
              {question}
              {open === i ? <Minus /> : <Plus />}
            </Button>
            {open === i && (
              <p id={`faqpage-answer-${i}`} className="faq-answer">
                {answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

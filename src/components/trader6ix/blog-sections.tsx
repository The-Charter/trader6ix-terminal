"use client";

import { useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { Eyebrow } from "./sections";
import { images } from "@/assets/images";
import hero from "@/assets/about-hero.png.asset.json";

const categories = [
  "All",
  "Market Insights",
  "Consumer Behavior",
  "Investment Strategies",
  "Industry Trends",
] as const;

const posts = [
  {
    cat: "Market Insights",
    title: "Market Insights & Daily Trends",
    author: "Ethan Collins",
    date: "Jul 17, 2025",
    mins: 20,
    img: 3,
  },
  {
    cat: "Consumer Behavior",
    title: "Proven Trading Strategies That Work",
    author: "Kazi Ehsan",
    date: "Jul 23, 2025",
    mins: 18,
    img: 9,
  },
  {
    cat: "Investment Strategies",
    title: "Chart Analysis & Technical Patterns",
    author: "Olivia Carter",
    date: "Jul 30, 2025",
    mins: 8,
    img: 10,
  },
  {
    cat: "Industry Trends",
    title: "Emerging Market Opportunities",
    author: "Daniel Harris",
    date: "Jul 20, 2025",
    mins: 16,
    img: 11,
  },
  {
    cat: "Industry Trends",
    title: "Long-Term vs Short-Term Gains",
    author: "Daniel Harris",
    date: "Jul 8, 2025",
    mins: 19,
    img: 12,
  },
  {
    cat: "Market Insights",
    title: "Shifting Market Preferences in 2025",
    author: "Ethan Collins",
    date: "Sep 9, 2025",
    mins: 12,
    img: 14,
  },
] as const;

export function BlogHero() {
  return (
    <section className="int-hero blog-hero">
      <img className="int-backdrop" src={hero.url} alt="" />
      <div className="site-container int-hero-content">
        <Eyebrow>Our Blog</Eyebrow>
        <h1>Check out what we've got in our resource vault!</h1>
        <p>
          Read our latest posts for trading trends, market insights and practical tutorials from the
          Trader6ix team.
        </p>
      </div>
    </section>
  );
}

export function BlogPosts() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const list = active === "All" ? posts : posts.filter((p) => p.cat === active);
  return (
    <section className="site-container blog-posts">
      <div className="blog-tabs" role="tablist" aria-label="Blog categories">
        {categories.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={active === c}
            className={active === c ? "active" : ""}
            onClick={() => setActive(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="blog-grid">
        {list.map((p) => (
          <article className="blog-card" key={p.title}>
            <div className="blog-cover">
              <img src={images[p.img]} alt={p.title} loading="lazy" />
              <span className="blog-cat">{p.cat}</span>
            </div>
            <h2>{p.title}</h2>
            <div className="blog-meta">
              <span>{p.author}</span>
              <span className="blog-dot" />
              <span>{p.date}</span>
              <span className="blog-dot" />
              <span>
                <Clock size={13} /> {p.mins} min read
              </span>
            </div>
            <span className="blog-read">
              Read article <ArrowRight size={14} />
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

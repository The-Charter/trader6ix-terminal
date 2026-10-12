"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Globe,
  TrendingUp,
  LineChart,
  MapPin,
  PieChart,
  Heart,
  HeartPulse,
  CalendarDays,
  Plane,
} from "lucide-react";
import { Eyebrow } from "./sections";
import hero from "@/assets/about-hero.png.asset.json";

const positions = [
  ["Product Manager", "On-site"],
  ["Front-end Developer", "Hybrid"],
  ["Data Analyst", "Remote"],
  ["DevOps Engineer", "On-site"],
  ["Content Strategist", "Remote"],
] as const;

const why = [
  {
    icon: Globe,
    title: "Remote-First & Global",
    text: "Trading is 24/7 — and so are we. Work from anywhere, collaborate globally, and build tools that support users in every time zone.",
  },
  {
    icon: TrendingUp,
    title: "Join a Growing Fintech Product",
    text: "With trading volumes and user engagement growing every month, Trader6ix is scaling fast. Join us in building a platform that combines powerful technology with real-time financial insights.",
  },
  {
    icon: LineChart,
    title: "Learn with the Markets",
    text: "At Trader6ix, we grow with the markets. You'll gain hands-on experience with live data, trading patterns, and user behavior in one of the most dynamic industries on earth.",
  },
] as const;

const perks = [
  {
    icon: MapPin,
    title: "Work from anywhere",
    text: "You can work from anywhere you like with our flexible policy.",
  },
  {
    icon: PieChart,
    title: "Equity in Owner",
    text: "All full-time team members in qualifying countries get pre-IPO equity in Owner.",
  },
  {
    icon: Heart,
    title: "Benefits to support your success",
    text: "We set you up for success, no matter where you are or where you’re headed.",
  },
  {
    icon: HeartPulse,
    title: "Healthcare Coverage",
    text: "We’ve got you covered with great health, dental, and vision plans.",
  },
  {
    icon: CalendarDays,
    title: "Unlimited PTO",
    text: "You pick your schedule! We trust our team to choose their own work hours without micromanaging.",
  },
  {
    icon: Plane,
    title: "Team retreats",
    text: "We love making real connections with our coworkers, so we host a bunch of retreats each year to strengthen our friendships, celebrate our wins, and plan for the future.",
  },
] as const;

export function CareerHero() {
  return (
    <section className="int-hero career-hero">
      <img className="int-backdrop" src={hero.url} alt="" />
      <div className="site-container int-hero-content">
        <Eyebrow>Career</Eyebrow>
        <h1>Join the Team Powering the Next Generation of Traders</h1>
        <p>
          Trader6ix is transforming the way people trade — from real-time insights to smart trading
          tools and data-driven decision support. We\'re not just another trading platform. We\'re
          building an ecosystem where strategy, speed, and simplicity empower traders of all levels
          to grow.
        </p>
      </div>
    </section>
  );
}

export function CareerPositions() {
  return (
    <section className="site-container career-positions">
      <h2>Open positions</h2>
      <div className="career-list">
        {positions.map(([role, mode]) => (
          <div className="career-row" key={role}>
            <div className="career-role">
              <span className="career-role-icon">
                <Briefcase size={20} />
              </span>
              <strong>{role}</strong>
              <span className="career-mode">{mode}</span>
            </div>
            <Link href="/contact" className="career-apply">
              Apply Now <ArrowUpRight size={18} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CareerWhy() {
  return (
    <section className="site-container career-why">
      <div className="center-heading">
        <Eyebrow>Why Trader6ix</Eyebrow>
        <h2>Why Work at Trader6ix?</h2>
        <p>
          Trader6ix isn’t just software — it’s a platform that helps traders make real money and
          reduce risk. Every line of code, design decision, or campaign you create can influence
          real-world trades.
        </p>
      </div>
      <div className="career-why-grid">
        {why.map(({ icon: Icon, title, text }) => (
          <article className="career-card" key={title}>
            <span className="career-card-icon">
              <Icon size={26} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CareerPerks() {
  return (
    <section className="site-container career-perks">
      <div className="center-heading">
        <Eyebrow>Perks</Eyebrow>
        <h2>Perks & Benefits</h2>
      </div>
      <div className="career-perks-grid">
        {perks.map(({ icon: Icon, title, text }) => (
          <article className="career-card" key={title}>
            <span className="career-card-icon">
              <Icon size={26} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

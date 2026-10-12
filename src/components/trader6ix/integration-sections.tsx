"use client";

import Link from "next/link";
import { Eyebrow } from "./sections";
import hero from "@/assets/about-hero.png.asset.json";
import a0 from "@/assets/integration-0.svg.asset.json";
import a1 from "@/assets/integration-1.svg.asset.json";
import a2 from "@/assets/integration-2.svg.asset.json";
import a3 from "@/assets/integration-3.svg.asset.json";
import a4 from "@/assets/integration-4.svg.asset.json";
import a5 from "@/assets/integration-5.svg.asset.json";
import a6 from "@/assets/integration-6.svg.asset.json";
import a7 from "@/assets/integration-7.svg.asset.json";
import a8 from "@/assets/integration-8.svg.asset.json";

const apps = [
  ["Behance", a0],
  ["Instagram", a1],
  ["WordPress", a2],
  ["Blogger", a3],
  ["Ghost", a4],
  ["Wix", a5],
  ["Squarespace", a6],
  ["Weebly", a7],
  ["Medium", a8],
] as const;

export function IntegrationHero() {
  return (
    <section className="int-hero">
      <img className="int-backdrop" src={hero.url} alt="" />
      <div className="site-container int-hero-content">
        <Eyebrow>Integrations</Eyebrow>
        <h1>Integrations</h1>
        <p>Make your customer experience awesome by connecting with the apps you love!</p>
      </div>
    </section>
  );
}

export function IntegrationGrid() {
  return (
    <section className="site-container int-apps">
      <h2>Connect Trader6ix To Your Favorite Apps!</h2>
      <div className="int-grid">
        {apps.map(([name, a]) => (
          <Link key={name} className="int-card" href={`/integration/${name.toLowerCase()}`}>
            <span className="int-icon">
              <img src={a.url} alt="" />
            </span>
            <span>{name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

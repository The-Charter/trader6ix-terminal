"use client";

import Link from "next/link";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <main className="app-page">
      <div
        style={{
          minHeight: "65vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <span className="site-soon">Coming soon</span>
        <h1 style={{ fontSize: "2rem", fontWeight: 600 }}>{title}</h1>
        <p style={{ maxWidth: "32rem", opacity: 0.75 }}>{description}</p>
        <Link href="/spot" className="quote-button">
          Go to Spot →
        </Link>
      </div>
    </main>
  );
}

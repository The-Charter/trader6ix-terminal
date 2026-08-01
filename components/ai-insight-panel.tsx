"use client";

const DEMO_INSIGHTS: Record<string, { trend: string; momentum: string; keyLevel: string; observation: string; risk: string }> = {
  "BTC-PERP": {
    trend: "Bullish",
    momentum: "Strong",
    keyLevel: "$100,800 support",
    observation: "Price is holding above the recent support zone with steady buying interest.",
    risk: "High volatility around round-number levels.",
  },
  "ETH-PERP": {
    trend: "Neutral",
    momentum: "Moderate",
    keyLevel: "$3,750 resistance",
    observation: "Consolidating in a tight range after the recent move higher.",
    risk: "A break below range support could accelerate downside.",
  },
  "SOL-PERP": {
    trend: "Bullish",
    momentum: "Strong",
    keyLevel: "$178 support",
    observation: "Outpacing majors on relative strength over the past sessions.",
    risk: "Higher beta than BTC/ETH — larger swings in both directions.",
  },
};

export function AIInsightPanel({ symbol }: { symbol: string }) {
  const insight = DEMO_INSIGHTS[symbol];
  if (!insight) return null;

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{symbol} Market Insight</p>
        <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[10px] uppercase text-accent">Demo</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-ink-3">Trend: </span>
          <span className="text-ink">{insight.trend}</span>
        </div>
        <div>
          <span className="text-ink-3">Momentum: </span>
          <span className="text-ink">{insight.momentum}</span>
        </div>
        <div className="col-span-2">
          <span className="text-ink-3">Key level: </span>
          <span className="text-ink">{insight.keyLevel}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-2">{insight.observation}</p>
      <p className="mt-1 text-xs text-warn">Risk: {insight.risk}</p>
      <p className="mt-2 text-[10px] text-ink-3">
        Demo analysis only — not financial advice, not based on live data.
      </p>
    </div>
  );
}

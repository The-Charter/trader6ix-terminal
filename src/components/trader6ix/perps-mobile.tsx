"use client";

/**
 * Perps mobile terminal — design preview.
 *
 * A faithful port of the compact `charter_v4.html` phone layout (markets list,
 * chart with timeframes, collapsible trade sheet, positions, history, tools and
 * a bottom navigation) into a full-height, zero-page-scroll shell that fits the
 * real mobile browser viewport. The reference's mock phone frame and fake
 * status bar are intentionally NOT reproduced — the real browser supplies those.
 *
 * Everything here is DEMO data held in local state. No order, fee, wallet or
 * network call is made; buttons only show the same confirmations the reference
 * does. It is mounted at /perps/preview only; /perps still says "Coming soon".
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/components/trader6ix/theme";
import "./perps-mobile.css";

type Cat = "fx" | "crypto" | "comm";
type Pair = {
  sym: string;
  cat: Cat;
  icon: string;
  bid: number;
  ask: number;
  chg: number;
  spread: number;
};

const PLATFORMS = [
  { name: "Avantis", chain: "Base Network", accent: "#00D4FF", accentL: "#0099BB", soon: false },
  { name: "Hibachi", chain: "Arc Network", accent: "#C85A1A", accentL: "#A34515", soon: true },
  { name: "Hyperliquid", chain: "HyperEVM", accent: "#34D399", accentL: "#16A34A", soon: true },
];

const SEED_PAIRS: Pair[] = [
  { sym: "EUR/USD", cat: "fx", icon: "€/$", bid: 1.08542, ask: 1.0855, chg: 0.12, spread: 0.8 },
  { sym: "GBP/USD", cat: "fx", icon: "£/$", bid: 1.27183, ask: 1.27195, chg: -0.08, spread: 1.2 },
  { sym: "USD/JPY", cat: "fx", icon: "$/¥", bid: 149.821, ask: 149.835, chg: 0.31, spread: 1.4 },
  { sym: "AUD/USD", cat: "fx", icon: "A/$", bid: 0.65312, ask: 0.6532, chg: -0.15, spread: 0.8 },
  { sym: "USD/CHF", cat: "fx", icon: "$/₣", bid: 0.89714, ask: 0.89724, chg: 0.05, spread: 1.0 },
  { sym: "EUR/GBP", cat: "fx", icon: "€/£", bid: 0.85282, ask: 0.85294, chg: -0.03, spread: 1.2 },
  { sym: "BTC/USD", cat: "crypto", icon: "₿", bid: 103420, ask: 103445, chg: 1.82, spread: 25 },
  { sym: "ETH/USD", cat: "crypto", icon: "Ξ", bid: 3841.2, ask: 3842.4, chg: 0.94, spread: 1.2 },
  { sym: "SOL/USD", cat: "crypto", icon: "◎", bid: 182.41, ask: 182.55, chg: 2.31, spread: 0.14 },
  { sym: "XAU/USD", cat: "comm", icon: "Au", bid: 2341.5, ask: 2342.3, chg: 0.28, spread: 0.8 },
  { sym: "XAG/USD", cat: "comm", icon: "Ag", bid: 29.142, ask: 29.158, chg: -0.41, spread: 0.016 },
];

const SEED_POSITIONS = [
  { id: "p1", sym: "EUR/USD", dir: "BUY", lots: 0.1, open: 1.0821, sl: 1.078, tp: 1.09, pl: 36.2, openVal: 10821 },
  { id: "p2", sym: "BTC/USD", dir: "SELL", lots: 0.01, open: 104100, sl: 105000, tp: 101000, pl: -6.8, openVal: 1041 },
  { id: "p3", sym: "GBP/USD", dir: "BUY", lots: 0.05, open: 1.27041, sl: 1.265, tp: 1.28, pl: 93.8, openVal: 6352 },
];

const HISTORY = [
  { sym: "EUR/USD", dir: "BUY", lots: 0.2, open: 1.07841, close: 1.0832, pl: 95.8, pct: 2.11, date: "2026-06-25 14:32" },
  { sym: "BTC/USD", dir: "BUY", lots: 0.005, open: 99200, close: 102400, pl: 160.0, pct: 3.55, date: "2026-06-24 09:17" },
  { sym: "GBP/USD", dir: "SELL", lots: 0.1, open: 1.2814, close: 1.272, pl: 94.0, pct: 2.08, date: "2026-06-23 16:45" },
  { sym: "USD/JPY", dir: "BUY", lots: 0.15, open: 148.2, close: 148.05, pl: -22.5, pct: -0.5, date: "2026-06-22 11:03" },
  { sym: "XAU/USD", dir: "BUY", lots: 0.02, open: 2298.0, close: 2341.5, pl: 87.0, pct: 1.89, date: "2026-06-20 08:55" },
  { sym: "ETH/USD", dir: "SELL", lots: 0.05, open: 3920.0, close: 3841.2, pl: 39.4, pct: 0.87, date: "2026-06-18 13:20" },
];

const NEWS = [
  { time: "14:30", impact: "high", ccy: "USD", title: "US CPI YoY · Forecast 3.1% vs Prev 3.2%" },
  { time: "15:00", impact: "med", ccy: "EUR", title: "ECB Lagarde speaks · Frankfurt summit" },
  { time: "16:30", impact: "low", ccy: "GBP", title: "UK Retail Sales MoM" },
  { time: "18:00", impact: "high", ccy: "USD", title: "FOMC Meeting Minutes released" },
  { time: "20:00", impact: "med", ccy: "JPY", title: "BoJ Core CPI · Forecast 2.3%" },
] as const;
const IMPACT: Record<string, string> = { high: "#EF4444", med: "#F59E0B", low: "#22C55E" };

const TIMEFRAMES = ["M1", "M5", "M15", "H1", "H4", "D1", "W1"];

const ORDER_TYPES = ["market", "blimit", "slimit", "bstop", "sstop"] as const;
type OrderType = (typeof ORDER_TYPES)[number];
const OT_PRICE_LABELS: Record<string, string> = {
  blimit: "Buy limit price",
  slimit: "Sell limit price",
  bstop: "Buy stop price",
  sstop: "Sell stop price",
};
const OT_TOAST: Record<OrderType, string> = {
  market: "Market",
  blimit: "Buy Limit",
  slimit: "Sell Limit",
  bstop: "Buy Stop",
  sstop: "Sell Stop",
};

type Page = "markets" | "chart" | "positions" | "history" | "tools";

function fp(p: number | undefined, sym?: string) {
  if (p === undefined || p === null || Number.isNaN(p)) return "—";
  if ((sym ?? "").includes("JPY")) return p.toFixed(3);
  if (p >= 1000) return p.toFixed(2);
  if (p >= 10) return p.toFixed(3);
  return p.toFixed(5);
}

/** Small deterministic PRNG so a pair + timeframe always draws the same series. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const ICONS = {
  markets: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="14" width="3" height="6" rx="0.5" />
      <rect x="11" y="9" width="3" height="11" rx="0.5" />
      <rect x="16" y="4" width="3" height="16" rx="0.5" />
      <polyline points="5,10 8,7 12,11 16,6" />
    </svg>
  ),
  positions: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="12 8 12 12 14 14" />
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};
const NAV: { id: Page; label: string }[] = [
  { id: "markets", label: "Markets" },
  { id: "chart", label: "Chart" },
  { id: "positions", label: "Positions" },
  { id: "history", label: "History" },
  { id: "tools", label: "Tools" },
];

export function PerpsMobile() {
  const theme = useTheme();
  const light = theme === "light";

  const [page, setPage] = useState<Page>("markets");
  const [pairs, setPairs] = useState<Pair[]>(SEED_PAIRS);
  const [selSym, setSelSym] = useState(SEED_PAIRS[0].sym);
  const [mktTab, setMktTab] = useState<"all" | Cat>("all");
  const [filter, setFilter] = useState("");
  const [tf, setTf] = useState("M1");
  const [platIdx, setPlatIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [sizeMode, setSizeMode] = useState<"lots" | "leverage">("lots");
  const [size, setSize] = useState("0.01");
  const [limitPrice, setLimitPrice] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [toast, setToast] = useState<{ msg: string; col: string } | null>(null);
  const [positions, setPositions] = useState(SEED_POSITIONS);
  const [risk, setRisk] = useState({ bal: "5000", pct: "1", entry: "1.08542", stop: "1.07500" });

  const sel = pairs.find((p) => p.sym === selSym) ?? pairs[0];
  const plat = PLATFORMS[platIdx];
  const accent = light ? plat.accentL : plat.accent;

  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = useCallback((msg: string, col: string) => {
    setToast({ msg, col });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /* Demo price simulation — same cadence and scale as the reference. */
  useEffect(() => {
    const id = window.setInterval(() => {
      setPairs((list) =>
        list.map((p) => {
          const bid = Math.max(0.0001, p.bid + (Math.random() - 0.5) * p.bid * 0.00015);
          const ask = bid + p.spread * (p.sym.includes("JPY") ? 0.01 : 0.0001);
          return { ...p, bid, ask, chg: p.chg + (Math.random() - 0.5) * 0.02 };
        }),
      );
      setPositions((list) => list.map((p) => ({ ...p, pl: p.pl + (Math.random() - 0.49) * 0.6 })));
    }, 3500);
    return () => window.clearInterval(id);
  }, []);

  const go = (next: Page) => {
    setPage(next);
    if (next === "chart") setSheetOpen(false);
  };

  const margin = useMemo(() => {
    const v = parseFloat(size) || 0;
    const m = sizeMode === "lots" ? (v * 100000 * sel.ask) / 100 : 1000 / Math.max(v, 0.1);
    return `$${m.toFixed(2)}`;
  }, [size, sizeMode, sel.ask]);

  const riskOut = useMemo(() => {
    const bal = parseFloat(risk.bal) || 5000;
    const rp = parseFloat(risk.pct) || 1;
    const en = parseFloat(risk.entry) || 1.08542;
    const stop = parseFloat(risk.stop) || 1.075;
    const amt = (bal * rp) / 100;
    const diff = Math.abs(en - stop);
    const pips = sel.sym.includes("JPY") ? diff * 100 : diff * 10000;
    const pv = amt / Math.max(pips, 0.001);
    const lots = pv / 10;
    const lev = (lots * 100000 * en) / bal;
    return {
      amt: `$${amt.toFixed(2)}`,
      lots: `${lots.toFixed(3)} lots`,
      lev: `${lev.toFixed(1)}×`,
      pv: `$${pv.toFixed(2)}/pip`,
      pips: `${pips.toFixed(1)} pips`,
    };
  }, [risk, sel.sym]);

  const cyclePlatform = () => {
    const next = (platIdx + 1) % PLATFORMS.length;
    setPlatIdx(next);
    if (PLATFORMS[next].soon) showToast(`${PLATFORMS[next].name} — coming soon`, "#F59E0B");
  };

  const execute = (dir: "BUY" | "SELL") => {
    // Demo only: mirrors the reference's confirmation, sends nothing anywhere.
    setSheetOpen(false);
    showToast(
      `${OT_TOAST[orderType]} ${dir} ${sel.sym} @ ${fp(dir === "BUY" ? sel.ask : sel.bid, sel.sym)} · demo`,
      dir === "BUY" ? (light ? "#16A34A" : "#22C55E") : light ? "#DC2626" : "#EF4444",
    );
  };

  const visiblePairs = pairs.filter(
    (p) =>
      (mktTab === "all" || p.cat === mktTab) && p.sym.toLowerCase().includes(filter.toLowerCase()),
  );
  const groups: [string, Cat][] = [
    ["Forex", "fx"],
    ["Crypto", "crypto"],
    ["Commodities", "comm"],
  ];

  const totalPl = positions.reduce((sum, p) => sum + p.pl, 0);
  const totalPct = (totalPl / 4820) * 100;

  const priceRow = (p: Pair) => (
    <button
      type="button"
      key={p.sym}
      className="pm-mkt-row"
      onClick={() => {
        setSelSym(p.sym);
        go("chart");
      }}
    >
      <span className="pm-mkt-icon">{p.icon}</span>
      <span className="pm-grow">
        <span className="pm-mkt-sym">{p.sym}</span>
        <span className="pm-mkt-sub">
          {p.cat === "fx" ? "Forex" : p.cat === "crypto" ? "Crypto" : "Commodity"}
        </span>
      </span>
      <span className="pm-right">
        <span className="pm-mkt-price">{fp(p.bid, p.sym)}</span>
        <span className={`pm-mkt-chg ${p.chg >= 0 ? "pm-up" : "pm-dn"}`}>
          {p.chg >= 0 ? "+" : ""}
          {p.chg.toFixed(2)}%
        </span>
      </span>
    </button>
  );

  return (
    <div
      className={`pm-root ${light ? "pm-light" : "pm-dark"}`}
      style={{ ["--pm-accent" as string]: accent }}
    >
      <header className="pm-tophead">
        <Link href="/spot" className="pm-logo" aria-label="Back to Spot">
          TRADER6IX
          <span className="pm-demo">DEMO</span>
        </Link>
        <button type="button" className="pm-plat-chip" onClick={cyclePlatform}>
          <span className="pm-plat-dot" style={{ background: accent }} />
          <span>
            <span className="pm-plat-name">{plat.name}</span>
            <span className="pm-plat-chain">{plat.chain}</span>
          </span>
        </button>
        <span className="pm-icon-btn" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pm-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
            <path d="M16 12h4v4h-4a2 2 0 0 1 0-4z" />
          </svg>
        </span>
      </header>

      <div className="pm-screen">
        <div
          className={`pm-toast${toast ? " show" : ""}`}
          style={
            toast
              ? {
                  background: toast.col,
                  color: ["#22C55E", "#16A34A", "#F59E0B"].includes(toast.col) ? "#000" : "#fff",
                }
              : undefined
          }
          role="status"
        >
          {toast?.msg}
        </div>

        {page === "markets" && (
          <section className="pm-page">
            <div className="pm-search-wrap">
              <input
                className="pm-search"
                placeholder="Search — EUR/USD, BTC..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="pm-cat-tabs">
              {(
                [
                  ["all", "All"],
                  ["fx", "Forex"],
                  ["crypto", "Crypto"],
                  ["comm", "Commod"],
                ] as const
              ).map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  className={`pm-ctab${mktTab === id ? " active" : ""}`}
                  onClick={() => setMktTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="pm-list">
              {mktTab === "all"
                ? groups.map(([label, cat]) => {
                    const rows = visiblePairs.filter((p) => p.cat === cat);
                    return rows.length ? (
                      <div key={cat}>
                        <div className="pm-sect-lbl">{label}</div>
                        {rows.map(priceRow)}
                      </div>
                    ) : null;
                  })
                : visiblePairs.map(priceRow)}
            </div>
          </section>
        )}

        {page === "chart" && (
          <section className="pm-page">
            <ChartHeader sel={sel} platName={plat.name} />
            <div className="pm-tf-row">
              {TIMEFRAMES.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`pm-tf${tf === t ? " active" : ""}`}
                  onClick={() => setTf(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <CandleChart pair={sel} tf={tf} light={light} accent={accent} />
            <div className="pm-trade-strip">
              <button type="button" className="pm-trade-handle" onClick={() => setSheetOpen((v) => !v)} aria-expanded={sheetOpen}>
                <span className={`pm-tth-arrow${sheetOpen ? " up" : ""}`}>▲</span>
                <span className="pm-tth-label">Trade</span>
                <span className="pm-tth-prices">
                  <span className="pm-tth-sell">Sell {fp(sel.bid, sel.sym)}</span>
                  <span className="pm-tth-buy">Buy {fp(sel.ask, sel.sym)}</span>
                </span>
              </button>
            </div>

            <div className={`pm-sheet${sheetOpen ? " open" : ""}`} aria-hidden={!sheetOpen}>
              <div className="pm-sheet-scroll">
                <div className="pm-sheet-handle" />
                <div className="pm-sheet-hdr">
                  <div>
                    <div className="pm-sheet-pair">{sel.sym}</div>
                    <div className="pm-sheet-plat">
                      {plat.name} · {plat.chain}
                    </div>
                  </div>
                  <button type="button" className="pm-sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close trade panel">
                    ×
                  </button>
                </div>
                <div className="pm-ot-grid">
                  <button
                    type="button"
                    className={`pm-ot-btn pm-ot-wide${orderType === "market" ? " active" : ""}`}
                    onClick={() => setOrderType("market")}
                  >
                    Market
                  </button>
                  {(
                    [
                      ["blimit", "Buy Limit"],
                      ["slimit", "Sell Limit"],
                      ["bstop", "Buy Stop"],
                      ["sstop", "Sell Stop"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      className={`pm-ot-btn${orderType === id ? " active" : ""}`}
                      onClick={() => setOrderType(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="pm-ba-row">
                  <div className="pm-ba-box pm-ba-sell">
                    <div className="pm-ba-lbl">Sell</div>
                    <div className="pm-ba-price">{fp(sel.bid, sel.sym)}</div>
                  </div>
                  <div className="pm-ba-box pm-ba-buy">
                    <div className="pm-ba-lbl">Buy</div>
                    <div className="pm-ba-price">{fp(sel.ask, sel.sym)}</div>
                  </div>
                </div>
                {orderType !== "market" && (
                  <div className="pm-limit-field">
                    <div className="pm-fl">{OT_PRICE_LABELS[orderType] ?? "Order price"}</div>
                    <input
                      className="pm-fi"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00000"
                      step="0.00001"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                    />
                  </div>
                )}
                <div className="pm-sz-toggle">
                  {(
                    [
                      ["lots", "Lot size"],
                      ["leverage", "Leverage ×"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      className={`pm-sz-btn${sizeMode === id ? " active" : ""}`}
                      onClick={() => {
                        setSizeMode(id);
                        setSize(id === "lots" ? "0.01" : "10");
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="pm-field-row">
                  <label className="pm-field">
                    <span className="pm-fl">{sizeMode === "lots" ? "Lot size" : "Leverage ×"}</span>
                    <input className="pm-fi" type="number" inputMode="decimal" step="0.01" value={size} onChange={(e) => setSize(e.target.value)} />
                  </label>
                  <label className="pm-field">
                    <span className="pm-fl">Margin req.</span>
                    <input className="pm-fi pm-ro" readOnly value={margin} />
                  </label>
                </div>
                <div className="pm-field-row">
                  <label className="pm-field">
                    <span className="pm-fl">Stop loss</span>
                    <input className="pm-fi" type="number" inputMode="decimal" placeholder="0.00000" value={sl} onChange={(e) => setSl(e.target.value)} />
                  </label>
                  <label className="pm-field">
                    <span className="pm-fl">Take profit</span>
                    <input className="pm-fi" type="number" inputMode="decimal" placeholder="0.00000" value={tp} onChange={(e) => setTp(e.target.value)} />
                  </label>
                </div>
                <div className="pm-exec-row">
                  <button type="button" className="pm-exec-sell" onClick={() => execute("SELL")}>
                    SELL
                  </button>
                  <button type="button" className="pm-exec-buy" onClick={() => execute("BUY")}>
                    BUY
                  </button>
                </div>
                <div className="pm-fee-note">
                  Fee: <span>0.05 USDC flat</span> · <span>{plat.name} · {plat.chain.replace(" Network", "")}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === "positions" && (
          <section className="pm-page">
            <div className="pm-head-block">
              <div className="pm-eq-grid">
                <div className="pm-eq-card">
                  <div className="pm-eq-label">Balance</div>
                  <div className="pm-eq-val">$4,820.00</div>
                  <div className="pm-eq-sub pm-up">+7.1% from start</div>
                </div>
                <div className="pm-eq-card">
                  <div className="pm-eq-label">Equity</div>
                  <div className="pm-eq-val">${(4820 + totalPl).toFixed(2)}</div>
                  <div className="pm-eq-sub pm-up">+9.8% all time</div>
                </div>
                <div className="pm-eq-card">
                  <div className="pm-eq-label">Floating P/L</div>
                  <div className={`pm-eq-val ${totalPl >= 0 ? "pm-up" : "pm-dn"}`}>
                    {totalPl >= 0 ? "+" : ""}${Math.abs(totalPl).toFixed(2)}
                  </div>
                  <div className={`pm-eq-sub ${totalPct >= 0 ? "pm-up" : "pm-dn"}`}>
                    {totalPct >= 0 ? "+" : ""}
                    {totalPct.toFixed(2)}%
                  </div>
                </div>
                <div className="pm-eq-card">
                  <div className="pm-eq-label">Free margin</div>
                  <div className="pm-eq-val">$4,340.00</div>
                  <div className="pm-eq-sub">Used $480</div>
                </div>
              </div>
            </div>
            <div className="pm-list pm-pad">
              {positions.map((p) => {
                const pct = (p.pl / p.openVal) * 100;
                const cls = p.pl >= 0 ? "pm-up" : "pm-dn";
                return (
                  <div className="pm-card" key={p.id}>
                    <div className="pm-card-top">
                      <div className="pm-inline">
                        <span className="pm-card-sym">{p.sym}</span>
                        <span className={`pm-dir ${p.dir === "BUY" ? "pm-dir-buy" : "pm-dir-sell"}`}>{p.dir}</span>
                      </div>
                      <div className="pm-right">
                        <div className={`pm-pl-val ${cls}`}>
                          {p.pl >= 0 ? "+" : "-"}${Math.abs(p.pl).toFixed(2)}
                        </div>
                        <div className={`pm-pl-pct ${cls}`}>
                          {pct >= 0 ? "+" : ""}
                          {pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="pm-cell-grid">
                      <Cell label="Lots" value={String(p.lots)} />
                      <Cell label="Open" value={fp(p.open, p.sym)} />
                      <Cell label="Platform" value={plat.name} />
                      <Cell label="SL" value={String(p.sl)} cls="pm-dn" />
                      <Cell label="TP" value={String(p.tp)} cls="pm-up" />
                      <Cell label="Fee" value="0.05 USDC" />
                    </div>
                    <button
                      type="button"
                      className="pm-close-pos"
                      onClick={() => showToast(`Closing position · ${plat.name} · demo`, "#F59E0B")}
                    >
                      Close position
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {page === "history" && (
          <section className="pm-page">
            <div className="pm-head-block">
              <div className="pm-eq-grid">
                {(
                  [
                    ["Total P/L", "+$1,284.50", true],
                    ["Win rate", "67.3%", false],
                    ["Trades", "41", false],
                    ["Avg R:R", "1 : 2.1", false],
                  ] as const
                ).map(([label, value, up]) => (
                  <div className="pm-eq-card" key={label}>
                    <div className="pm-eq-label">{label}</div>
                    <div className={`pm-eq-val${up ? " pm-up" : ""}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pm-list pm-pad">
              {HISTORY.map((h) => {
                const cls = h.pl >= 0 ? "pm-up" : "pm-dn";
                const s = h.pl >= 0 ? "+" : "";
                return (
                  <div className="pm-card pm-card-sm" key={h.date + h.sym}>
                    <div className="pm-card-top">
                      <div className="pm-inline">
                        <span className="pm-card-sym pm-sm">{h.sym}</span>
                        <span className={`pm-dir ${h.dir === "BUY" ? "pm-dir-buy" : "pm-dir-sell"}`}>{h.dir}</span>
                      </div>
                      <div className="pm-right">
                        <div className={`pm-pl-val pm-sm ${cls}`}>
                          {s}${Math.abs(h.pl).toFixed(2)}
                        </div>
                        <div className={`pm-pl-pct ${cls}`}>
                          {s}
                          {h.pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="pm-cell-grid pm-cell-grid-tight">
                      <Cell label="Lots" value={String(h.lots)} />
                      <Cell label="Open" value={fp(h.open, h.sym)} />
                      <Cell label="Close" value={fp(h.close, h.sym)} />
                    </div>
                    <div className="pm-date">{h.date}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {page === "tools" && (
          <section className="pm-page">
            <div className="pm-list pm-tools">
              <div className="pm-tsect-title">Risk calculator</div>
              <div className="pm-tool-card pm-tool-pad">
                <div className="pm-field-row">
                  <label className="pm-field">
                    <span className="pm-fl">Balance (USDC)</span>
                    <input className="pm-fi" type="number" inputMode="decimal" value={risk.bal} onChange={(e) => setRisk({ ...risk, bal: e.target.value })} />
                  </label>
                  <label className="pm-field">
                    <span className="pm-fl">Risk %</span>
                    <input className="pm-fi" type="number" inputMode="decimal" step="0.5" value={risk.pct} onChange={(e) => setRisk({ ...risk, pct: e.target.value })} />
                  </label>
                </div>
                <div className="pm-field-row">
                  <label className="pm-field">
                    <span className="pm-fl">Entry price</span>
                    <input className="pm-fi" type="number" inputMode="decimal" value={risk.entry} onChange={(e) => setRisk({ ...risk, entry: e.target.value })} />
                  </label>
                  <label className="pm-field">
                    <span className="pm-fl">Stop loss</span>
                    <input className="pm-fi" type="number" inputMode="decimal" value={risk.stop} onChange={(e) => setRisk({ ...risk, stop: e.target.value })} />
                  </label>
                </div>
                <div className="pm-rr-results">
                  <RR k="Risk amount" v={riskOut.amt} />
                  <RR k="Lot size" v={riskOut.lots} />
                  <RR k="Leverage" v={riskOut.lev} warn />
                  <RR k="Pip value" v={riskOut.pv} />
                  <RR k="Stop (pips)" v={riskOut.pips} />
                  <RR k="Charter fee" v="0.05 USDC flat" />
                </div>
              </div>

              <div className="pm-tsect-title">Economic calendar</div>
              <div className="pm-tool-card">
                {NEWS.map((n) => (
                  <div className="pm-news-row" key={n.time + n.ccy}>
                    <div className="pm-news-top">
                      <span className="pm-news-time">{n.time}</span>
                      <span className="pm-news-impact" style={{ background: IMPACT[n.impact] }} />
                      <span className="pm-news-ccy">{n.ccy}</span>
                    </div>
                    <div className="pm-news-title">{n.title}</div>
                  </div>
                ))}
              </div>

              <div className="pm-tsect-title">AI agent</div>
              <div className="pm-tool-card pm-tool-pad pm-ai-card">
                <div className="pm-center pm-ai-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--pm-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <line x1="12" y1="7" x2="12" y2="11" />
                    <line x1="8" y1="15" x2="8" y2="17" />
                    <line x1="16" y1="15" x2="16" y2="17" />
                    <circle cx="9" cy="15" r="1" fill="var(--pm-accent)" />
                    <circle cx="15" cy="15" r="1" fill="var(--pm-accent)" />
                  </svg>
                </div>
                <div className="pm-ai-title">Personal trading agent</div>
                <div className="pm-ai-sub">Train your own agent on Arc ERC-8004 — non-custodial, runs on your wallet.</div>
                <div className="pm-ai-feats">
                  {[
                    "Pattern recognition across FX + crypto",
                    "Risk-aware entry and SL/TP suggestions",
                    "Automated position management",
                    "Non-custodial — runs on your wallet",
                  ].map((f) => (
                    <div className="pm-ai-feat" key={f}>
                      <span className="pm-ai-dot" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="pm-center">
                  <span className="pm-ai-badge">Coming soon</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <nav className="pm-bottom-nav" aria-label="Terminal sections">
        {NAV.map((n) => (
          <button
            type="button"
            key={n.id}
            className={`pm-nav-item${page === n.id ? " active" : ""}`}
            aria-current={page === n.id ? "page" : undefined}
            onClick={() => go(n.id)}
          >
            <span className="pm-nav-icon">{ICONS[n.id]}</span>
            <span className="pm-nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Cell({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <div className="pm-cell-label">{label}</div>
      <div className={`pm-cell-val ${cls ?? ""}`}>{value}</div>
    </div>
  );
}

function RR({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="pm-rr-row">
      <span className="pm-rr-key">{k}</span>
      <span className={`pm-rr-val${warn ? " warn" : ""}`}>{v}</span>
    </div>
  );
}

/* --- chart ------------------------------------------------------------- */

const BARS = 58;
function buildCandles(sym: string, tf: string, base: number) {
  const rand = mulberry32(hashString(`${sym}:${tf}`));
  let price = base * (1 - 0.004);
  const out: { o: number; c: number; h: number; l: number }[] = [];
  for (let i = 0; i < BARS; i++) {
    const o = price;
    const c = o + (rand() - 0.47) * base * 0.002;
    const h = Math.max(o, c) + rand() * base * 0.0007;
    const l = Math.min(o, c) - rand() * base * 0.0007;
    out.push({ o, c, h, l });
    price = c;
  }
  return out;
}

function ChartHeader({ sel, platName }: { sel: Pair; platName: string }) {
  // O / H / L come from the same deterministic series the canvas draws.
  const { o, h, l } = useOhl(sel);
  return (
    <div className="pm-chart-topbar">
      <div className="pm-pair-row">
        <div>
          <div className="pm-cp-sym">{sel.sym}</div>
          <div className="pm-cp-price">{fp(sel.bid, sel.sym)}</div>
        </div>
        <div className="pm-right">
          <div className={`pm-cp-chg ${sel.chg >= 0 ? "pm-up" : "pm-dn"}`}>
            {sel.chg >= 0 ? "+" : ""}
            {sel.chg.toFixed(2)}%
          </div>
          <div className="pm-cp-spread">
            Spread {sel.spread} · {platName}
          </div>
        </div>
      </div>
      <div className="pm-ohlc">
        <span className="pm-ohlc-item">
          <span className="pm-ohlc-lbl">O </span>
          <span className="pm-ohlc-val">{fp(o, sel.sym)}</span>
        </span>
        <span className="pm-ohlc-item">
          <span className="pm-ohlc-lbl">H </span>
          <span className="pm-ohlc-val">{fp(h, sel.sym)}</span>
        </span>
        <span className="pm-ohlc-item">
          <span className="pm-ohlc-lbl">L </span>
          <span className="pm-ohlc-val">{fp(l, sel.sym)}</span>
        </span>
      </div>
    </div>
  );
}

function useOhl(sel: Pair) {
  const seed = useRef(sel.bid);
  const lastSym = useRef(sel.sym);
  if (lastSym.current !== sel.sym) {
    lastSym.current = sel.sym;
    seed.current = sel.bid;
  }
  return useMemo(() => {
    const candles = buildCandles(sel.sym, "ohl", seed.current);
    return {
      o: candles[0].o,
      h: Math.max(...candles.map((c) => c.h)),
      l: Math.min(...candles.map((c) => c.l)),
    };
  }, [sel.sym]);
}

function CandleChart({ pair, tf, light, accent }: { pair: Pair; tf: string; light: boolean; accent: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef({ sym: pair.sym, tf, base: pair.bid });
  if (baseRef.current.sym !== pair.sym || baseRef.current.tf !== tf) {
    baseRef.current = { sym: pair.sym, tf, base: pair.bid };
  }
  const { base } = baseRef.current;
  const candles = useMemo(() => buildCandles(pair.sym, tf, base), [pair.sym, tf, base]);

  const draw = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = light ? "#F0F0F0" : "#000";
    const grid = light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.04)";
    const up = light ? "#16A34A" : "#22C55E";
    const dn = light ? "#DC2626" : "#EF4444";
    const bw = W / BARS;

    // The last candle follows the live (demo) price; the rest are fixed.
    // The whole demo series is anchored so its last close equals the current
    // (demo) bid — the chart's price tag always agrees with the header price.
    const offset = pair.bid - candles[BARS - 1].c;
    const series = candles.map((c) => ({ o: c.o + offset, c: c.c + offset, h: c.h + offset, l: c.l + offset }));
    const lastC = series[BARS - 1];

    const maxP = Math.max(...series.map((c) => c.h));
    const minP = Math.min(...series.map((c) => c.l));
    const pad = (maxP - minP) * 0.1;
    const toY = (p: number) => H * 0.87 - ((p - minP + pad) / (maxP - minP + pad * 2)) * H * 0.79;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = H * 0.06 + i * H * 0.16;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 20-period moving average
    ctx.strokeStyle = light ? "#D97706" : "#F59E0B";
    ctx.lineWidth = 1;
    ctx.beginPath();
    series.forEach((_, i) => {
      const slice = series.slice(Math.max(0, i - 19), i + 1);
      const avg = slice.reduce((a, c) => a + c.c, 0) / slice.length;
      const x = i * bw + bw / 2;
      if (i === 0) ctx.moveTo(x, toY(avg));
      else ctx.lineTo(x, toY(avg));
    });
    ctx.stroke();

    series.forEach((c, i) => {
      const x = i * bw;
      const col = c.c >= c.o ? up : dn;
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      ctx.lineWidth = 0.6;
      const oy = toY(c.o);
      const cy = toY(c.c);
      const top = Math.min(oy, cy);
      const bh = Math.max(Math.abs(oy - cy), 1);
      ctx.fillRect(x + 1, top, bw - 2, bh);
      ctx.beginPath();
      ctx.moveTo(x + bw / 2, toY(c.h));
      ctx.lineTo(x + bw / 2, top);
      ctx.moveTo(x + bw / 2, top + bh);
      ctx.lineTo(x + bw / 2, toY(c.l));
      ctx.stroke();
    });

    // last-price line + tag
    const ly = toY(lastC.c);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(W - 62, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = accent;
    ctx.fillRect(W - 60, ly - 9, 58, 18);
    ctx.fillStyle = light ? "#fff" : "#000";
    ctx.font = "700 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(fp(lastC.c, pair.sym), W - 31, ly + 4);
  }, [accent, candles, light, pair.bid, pair.sym]);

  useEffect(() => {
    draw();
  }, [draw]);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div className="pm-chart-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="pm-canvas" role="img" aria-label={`${pair.sym} demo candlestick chart, ${tf}`} />
    </div>
  );
}

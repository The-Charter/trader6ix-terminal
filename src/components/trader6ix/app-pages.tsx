"use client";

import Link from "next/link";
import { ethers } from "ethers";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownUp,
  ArrowRightLeft,
  ArrowUpDown,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Icon,
  Moon,
  Pencil,
  RefreshCw,
  Search,
  Sun,
  Unplug,
  Wallet,
  CircleArrowUp,
  CircleCheck,
  CircleX,
  type IconNode,
} from "lucide-react";
import {
  clearSession,
  displayIdentity,
  useSession,
} from "@/components/trader6ix/session";
import { usePortfolioData } from "@/components/trader6ix/use-portfolio";
import { TokenIcon } from "@/components/trader6ix/token-icons";
import { toggleTheme, useTheme } from "@/components/trader6ix/theme";
import { usePrivyOptional, useWalletsOptional } from "@/components/trader6ix/privy-auth";
import { apiFetch, newIdempotencyKey } from "@/components/trader6ix/api-client";
import { ARC_CHAIN_ID, ARC_CHAIN_NAME, ARC_FAUCET_URL, IS_ARC_MAINNET, arcExplorerAddressUrl, arcExplorerTxUrl } from "@/lib/arc-network";
import logo from "@/assets/trader6ix-logo.png.asset.json";

/* ---------- shared app bar ---------- */
const appLinks = [
  { to: "/spot", label: "Spot" },
  { to: "/perps", label: "Perpetual" },
  { to: "/portfolio", label: "Portfolio" },
] as const;

/** Reads a message out of the API's `{ error: { message } }` envelope. */
function apiErrorMessage(payload: unknown, fallback: string): string {
  const error = (payload as { error?: { message?: string } | string } | null)?.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof error.message === "string") return error.message;
  return fallback;
}

/* A tap with a falling drop — lucide has no "faucet" glyph of its own. */
const faucetNode: IconNode = [
  ["path", { d: "M8 3.5h6", key: "faucet-handle" }],
  ["path", { d: "M11 3.5V5", key: "faucet-stem" }],
  ["path", { d: "M3 8h4", key: "faucet-pipe" }],
  ["rect", { x: "7", y: "5", width: "7", height: "6", rx: "1.5", key: "faucet-body" }],
  ["path", { d: "M14 8h5v3", key: "faucet-spout" }],
  [
    "path",
    {
      d: "M19 14.5c-1.1 1.4-1.6 2.1-1.6 2.9a1.6 1.6 0 0 0 3.2 0c0-.8-.5-1.5-1.6-2.9Z",
      key: "faucet-drop",
    },
  ],
  ["path", { d: "M7 20.5h11", key: "faucet-basin" }],
];

function AppBar() {
  const pathname = usePathname();
  const session = useSession();
  const router = useRouter();
  const privy = usePrivyOptional();
  const theme = useTheme();
  const [walletOpen, setWalletOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<
    { id: string; title: string; body: string; time: string; read: boolean }[]
  >([]);
  useEffect(() => {
    const wallet = session?.wallet;
    if (!wallet) {
      setNotifs([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        // Only ever fetches the connected wallet's own activity: the API
        // authorizes the address against the caller's linked wallets.
        const res = await apiFetch(`/api/data/activity?address=${encodeURIComponent(wallet)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !Array.isArray(json)) return;
        setNotifs(
          json.slice(0, 8).map((tx: { hash: string; type: string; summary: string; timestamp: number }) => ({
            id: tx.hash,
            title: tx.type === "swap" ? "Swap" : tx.type,
            body: tx.summary,
            time: new Date(tx.timestamp * 1000).toLocaleString(),
            read: false,
          })),
        );
      } catch {
        /* keep the current list on failure */
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [session?.wallet]);
  const unreadCount = notifs.filter((n) => !n.read).length;
  const markAllRead = () => setNotifs((list) => list.map((n) => ({ ...n, read: true })));
  const [copied, setCopied] = useState(false);
  const address = session?.wallet ?? "";
  const signOut = () => {
    clearSession();
    void privy?.logout().catch(() => {});
    router.replace("/auth");
  };
  const copyAddress = async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      try {
        const box = document.createElement("textarea");
        box.value = address;
        box.setAttribute("readonly", "");
        box.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(box);
        box.select();
        ok = document.execCommand("copy");
        document.body.removeChild(box);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };
  return (
    <header className="app-bar">
      <Link href="/" className="app-brand">
        <img src={logo.url} alt="Trader6ix" />
        <span>Trader6ix</span>
      </Link>
      <nav>
        {appLinks.map((l) => {
          const active = pathname === l.to || pathname.startsWith(l.to + "/");
          return (
            <Link
              key={l.to}
              href={l.to}
              className={active ? "app-nav-link active" : "app-nav-link"}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="app-bar-right">
        <span
          className={`app-network-pill${IS_ARC_MAINNET ? " live" : ""}`}
          title={`Connected to ${ARC_CHAIN_NAME} (chain ${ARC_CHAIN_ID})`}
        >
          <span className="dot" aria-hidden="true" />
          {ARC_CHAIN_NAME}
        </span>
        <button className="app-icon-btn" aria-label="Search">
          <Search size={18} />
        </button>
        {ARC_FAUCET_URL ? (
          <a
            className="app-icon-btn"
            href={ARC_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the testnet faucet"
            title="Get testnet USDC from the Circle faucet"
          >
            <Icon iconNode={faucetNode} size={18} />
          </a>
        ) : null}
        <div
          className="app-wallet-wrap"
          onKeyDown={(e) => {
            if (e.key === "Escape") setWalletOpen(false);
          }}
        >
          {walletOpen && (
            <button
              type="button"
              className="app-wallet-backdrop"
              aria-label="Close wallet options"
              onClick={() => setWalletOpen(false)}
            />
          )}
          <button
            type="button"
            className="app-wallet"
            aria-expanded={walletOpen}
            aria-haspopup="menu"
            onClick={() => {
              if (!session) {
                // login(), not connectWallet(): the latter only links an extra
                // wallet to an already-authenticated user and never signs in.
                if (privy) privy.login();
                else router.push("/auth");
                return;
              }
              setWalletOpen((v) => !v);
            }}
          >
            <Wallet size={16} /> {displayIdentity(session)}
          </button>
          {walletOpen && (
            <div className="app-wallet-menu" role="menu" aria-label="Wallet options">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void copyAddress();
                }}
              >
                {copied ? <CircleCheck size={15} /> : <Copy size={15} />}
                {copied ? "Address copied" : "Copy Address"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setWalletOpen(false);
                  signOut();
                }}
              >
                <Unplug size={15} /> Disconnect wallet
              </button>
            </div>
          )}
        </div>
        <div
          className="app-notif-wrap"
          onKeyDown={(e) => {
            if (e.key === "Escape") setNotifOpen(false);
          }}
        >
          {notifOpen && (
            <button
              type="button"
              className="app-wallet-backdrop"
              aria-label="Close notifications"
              onClick={() => setNotifOpen(false)}
            />
          )}
          <button
            type="button"
            className="app-icon-btn app-notif-btn"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={notifOpen}
            aria-haspopup="menu"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <i className="app-notif-dot" aria-hidden="true" />}
          </button>
          {notifOpen && (
            <div className="app-notif-menu" role="menu" aria-label="Notifications">
              <div className="app-notif-head">
                <b>Notifications</b>
                <button
                  type="button"
                  role="menuitem"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>
              {notifs.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  className={n.read ? "app-notif-item read" : "app-notif-item"}
                  onClick={() =>
                    setNotifs((list) => list.map((m) => (m.id === n.id ? { ...m, read: true } : m)))
                  }
                >
                  <span className="app-notif-title">
                    {n.title}
                    <small>{n.time}</small>
                  </span>
                  <span className="app-notif-body">{n.body}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="app-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

/* deterministic pseudo-random series for demo charts */
function series(n: number, seed: number, start: number, vol: number) {
  let s = seed,
    v = start;
  const out: { o: number; h: number; l: number; c: number; vol: number }[] = [];
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5 - (i < n * 0.55 ? 0.05 : -0.04);
    const o = v,
      c = v + r * vol;
    s = (s * 9301 + 49297) % 233280;
    const w = (s / 233280) * vol * 0.5;
    out.push({ o, c, h: Math.max(o, c) + w, l: Math.min(o, c) - w, vol: 0.2 + (s / 233280) * 0.8 });
    v = c;
  }
  return out;
}

/* ---------- PERPETUAL ---------- */
const book = Array.from({ length: 7 }, (_, i) => ({
  price: "92,710",
  size: "103,412",
  total: "1,697,228",
  depth: 30 + ((i * 37) % 70),
}));

type Market = {
  pair: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  dir: "up" | "down";
};
const markets: Market[] = [
  {
    pair: "BTC-USDC",
    name: "Bitcoin",
    symbol: "BTC",
    price: "92,048",
    change: "+3.16% / +2,640",
    dir: "up",
  },
  {
    pair: "ETH-USDC",
    name: "Ethereum",
    symbol: "ETH",
    price: "3,148.62",
    change: "+1.84% / +56.90",
    dir: "up",
  },
  {
    pair: "SOL-USDC",
    name: "Solana",
    symbol: "SOL",
    price: "184.25",
    change: "-2.10% / -3.96",
    dir: "down",
  },
  {
    pair: "XRP-USDC",
    name: "XRP",
    symbol: "XRP",
    price: "2.148",
    change: "+0.62% / +0.013",
    dir: "up",
  },
  {
    pair: "ARB-USDC",
    name: "Arbitrum",
    symbol: "ARB",
    price: "0.864",
    change: "-4.35% / -0.039",
    dir: "down",
  },
];

export function PerpsPage() {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderTab, setOrderTab] = useState("Market");
  const [bookTab, setBookTab] = useState("Order Book");
  const [bottomTab, setBottomTab] = useState("Open Orders");
  const [pct, setPct] = useState(40);
  const [tpsl, setTpsl] = useState(true);
  const [margin, setMargin] = useState("Cross");
  const [leverage, setLeverage] = useState("20x");
  const [openSelect, setOpenSelect] = useState<"margin" | "leverage" | null>(null);
  const [market, setMarket] = useState<Market>(markets[0]!);
  const [marketOpen, setMarketOpen] = useState(false);
  const marketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marketOpen) return;
    const onDown = (e: globalThis.MouseEvent) => {
      if (!marketRef.current?.contains(e.target as Node)) setMarketOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMarketOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [marketOpen]);
  const candles = useMemo(() => series(90, 7, 112, 6), []);
  const max = Math.max(...candles.map((c) => c.h)),
    min = Math.min(...candles.map((c) => c.l));
  const y = (v: number) => 10 + ((max - v) / (max - min)) * 330;

  return (
    <div className="app-page perps">
      <AppBar />

      <div className="perps-grid">
        <div className="perps-left">
          <section className="perps-panel perps-ticker">
            <div className="perps-market-wrap" ref={marketRef}>
              <button
                type="button"
                className="perps-market"
                aria-haspopup="listbox"
                aria-expanded={marketOpen}
                aria-label="Select trading pair"
                onClick={() => setMarketOpen(!marketOpen)}
              >
                <TokenIcon symbol={market.symbol} name={market.name} />
                <span className="perps-market-text">
                  <small>{market.pair}</small>
                  {market.price}
                </span>
                <ChevronsUpDown size={14} className="perps-market-caret" />
              </button>
              {marketOpen && (
                <div className="perps-market-menu" role="listbox" aria-label="Trading pair">
                  {markets.map((m) => (
                    <button
                      key={m.pair}
                      type="button"
                      role="option"
                      aria-selected={m.pair === market.pair}
                      className={m.pair === market.pair ? "on" : ""}
                      onClick={() => {
                        setMarket(m);
                        setMarketOpen(false);
                      }}
                    >
                      <TokenIcon symbol={m.symbol} name={m.name} />
                      <span className="perps-market-opt">
                        <b>{m.pair}</b>
                        <small>{m.name}</small>
                      </span>
                      <span className="perps-market-price">{m.price}</span>
                      {m.pair === market.pair && <CircleCheck size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <small>24h Change</small>
              <span className={market.dir}>{market.change}</span>
            </div>
            <div>
              <small>24h Volume</small>3,125,897
            </div>
            <div>
              <small>Position Cap</small>$15,000
            </div>
            <div>
              <small>Open Interest</small>$1.4B
            </div>
            <div>
              <small>Fund. / Countdown</small>0.0008% / 10:25
            </div>
          </section>

          <section className="perps-panel perps-chart">
            <div className="perps-chart-head">
              <b>{market.name} / USDC · 1D</b>
              <span className="muted">
                O 91,489.03 H 93,343.89 L 91,479.28 C 92,891.81{" "}
                <span className="up">+1,397.81 (+1.53%)</span>
              </span>
            </div>
            <svg viewBox="0 0 900 400" preserveAspectRatio="none" className="perps-svg">
              {candles.map((c, i) => {
                const x = 10 + i * 9.6,
                  up = c.c >= c.o;
                return (
                  <g key={i} className={up ? "c-up" : "c-down"}>
                    <rect
                      x={x + 1}
                      y={400 - c.vol * 60}
                      width={6}
                      height={c.vol * 60}
                      opacity=".35"
                    />
                    <line x1={x + 4} x2={x + 4} y1={y(c.h)} y2={y(c.l)} />
                    <rect
                      x={x + 1}
                      y={y(Math.max(c.o, c.c))}
                      width={6}
                      height={Math.max(1, Math.abs(y(c.o) - y(c.c)))}
                    />
                  </g>
                );
              })}
            </svg>
            <div className="perps-ranges">
              {["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "All"].map((r) => (
                <button key={r}>{r}</button>
              ))}
              <span className="muted">10:25:03 UTC</span>
            </div>
          </section>
        </div>

        <section className="perps-panel perps-book">
          <div className="perps-tabs">
            {["Order Book", "Trades"].map((t) => (
              <button key={t} className={bookTab === t ? "on" : ""} onClick={() => setBookTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="perps-book-row head">
            <span>Price</span>
            <span>Size (USDC)</span>
            <span>Total (USDC)</span>
          </div>
          {book.map((r, i) => (
            <div key={"a" + i} className="perps-book-row ask">
              <i style={{ width: `${r.depth}%` }} />
              <span>{r.price}</span>
              <span>{r.size}</span>
              <span>{r.total}</span>
            </div>
          ))}
          <div className="perps-book-row spread">
            <span>Spread</span>
            <span>1</span>
            <span>0.001%</span>
          </div>
          {book.map((r, i) => (
            <div key={"b" + i} className="perps-book-row bid">
              <i style={{ width: `${100 - r.depth / 1.5}%` }} />
              <span>{r.price}</span>
              <span>{r.size}</span>
              <span>{r.total}</span>
            </div>
          ))}
        </section>

        <aside className="perps-order">
          {openSelect && (
            <button
              type="button"
              className="perps-select-backdrop"
              aria-label="Close selector"
              onClick={() => setOpenSelect(null)}
            />
          )}
          <div className="perps-selects">
            <div className="perps-select">
              <button
                onClick={() => setOpenSelect(openSelect === "margin" ? null : "margin")}
                aria-expanded={openSelect === "margin"}
              >
                {margin} <ChevronsUpDown size={14} />
              </button>
              {openSelect === "margin" && (
                <div className="perps-select-menu" role="listbox" aria-label="Margin mode">
                  {["Cross", "Isolated"].map((o) => (
                    <button
                      key={o}
                      className={margin === o ? "on" : ""}
                      onClick={() => {
                        setMargin(o);
                        setOpenSelect(null);
                      }}
                    >
                      {o}
                      {margin === o && <CircleCheck size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="perps-select">
              <button
                onClick={() => setOpenSelect(openSelect === "leverage" ? null : "leverage")}
                aria-expanded={openSelect === "leverage"}
              >
                {leverage} <ChevronsUpDown size={14} />
              </button>
              {openSelect === "leverage" && (
                <div className="perps-select-menu" role="listbox" aria-label="Leverage">
                  {["1x", "5x", "10x", "20x", "50x", "Custom"].map((o) => (
                    <button
                      key={o}
                      className={leverage === o ? "on" : ""}
                      onClick={() => {
                        setLeverage(o);
                        setOpenSelect(null);
                      }}
                    >
                      {o}
                      {leverage === o && <CircleCheck size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="perps-panel perps-order-body">
            <div className="perps-tabs">
              {["Market", "Limit", "TP/SL"].map((t) => (
                <button
                  key={t}
                  className={orderTab === t ? "on" : ""}
                  onClick={() => setOrderTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="perps-side">
              <button className={side === "buy" ? "on-buy" : ""} onClick={() => setSide("buy")}>
                Buy / Long
              </button>
              <button className={side === "sell" ? "on-sell" : ""} onClick={() => setSide("sell")}>
                Sell / Short
              </button>
            </div>
            <Row
              k="Available to Trade"
              v={
                <>
                  18,044.75 <span className="perps-unit">USDC</span>
                </>
              }
            />
            <Row k="Current Position" v={<span className="up">846.99 BTC</span>} />
            <label className="perps-input">
              <span>Size</span>
              <input aria-label="Size" placeholder="" />
              <b>
                USDC <ChevronsUpDown size={12} />
              </b>
            </label>
            <div className="perps-slider">
              <div className="perps-slider-track" style={{ "--pct": pct / 100 } as CSSProperties}>
                <span className="perps-slider-fill" />
                {[0, 25, 50, 75, 100].map((t) => (
                  <span
                    key={t}
                    className={`perps-slider-tick${pct >= t ? " on" : ""}`}
                    style={{ "--t": t / 100 } as CSSProperties}
                  />
                ))}
                <span className="perps-slider-thumb" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => setPct(+e.target.value)}
                  aria-label="Size percent"
                />
              </div>
              <span className="perps-pct">
                {pct} <span className="perps-unit">%</span>
              </span>
            </div>
            <label className="perps-check">
              <input type="checkbox" /> Reduce Only
            </label>
            <label className="perps-check">
              <input type="checkbox" checked={tpsl} onChange={(e) => setTpsl(e.target.checked)} />{" "}
              Take Profit / Stop Loss
            </label>
            {tpsl && (
              <div className="perps-tp">
                <label className="perps-input">
                  <span>TP Price</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    aria-label="TP Price"
                    placeholder="--"
                  />
                </label>
                <label className="perps-input">
                  <span>Gain</span>
                  <input aria-label="Gain" placeholder="-- %" />
                  <b>
                    <ChevronsUpDown size={12} />
                  </b>
                </label>
                <label className="perps-input">
                  <span>SL Price</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    aria-label="SL Price"
                    placeholder="--"
                  />
                </label>
                <label className="perps-input">
                  <span>Loss</span>
                  <input aria-label="Loss" placeholder="-- %" />
                  <b>
                    <ChevronsUpDown size={12} />
                  </b>
                </label>
              </div>
            )}
            <button className="perps-place">Place Order</button>
            <Row k="Liquidation Price" v="147.86" />
            <Row k="Order Value" v="N/A" />
            <Row k="Margin Required" v="N/A" />
            <Row k="Slippage" v={<span className="up">Est: 0% / Max: 8.00%</span>} />
            <Row k="Fees" v="0.0450% / 0.0150%" />
          </div>
          <div className="perps-panel perps-summary">
            <b>Unified Account Summary</b>
            <Row k="Unified Account Ratio" v={<span className="up">18.23%</span>} />
            <Row k="Portfolio Value" v="$32,159.53" />
            <Row k="Unrealized PNL" v={<span className="up">$1,847.26</span>} />
            <Row k="Perps Maintenance Margin" v="$5,863.37" />
          </div>
        </aside>

        <section className="perps-panel perps-bottom">
          <div className="perps-tabs">
            {["Positions", "Open Orders", "Trade History", "News", "Economic Calendar"].map((t) => {
              const soon = t === "News" || t === "Economic Calendar";
              return (
                <button
                  key={t}
                  type="button"
                  className={bottomTab === t ? "on" : ""}
                  disabled={soon}
                  aria-disabled={soon}
                  title={soon ? "Coming soon" : undefined}
                  onClick={() => {
                    if (!soon) setBottomTab(t);
                  }}
                >
                  {t}
                  {t === "Economic Calendar" && <em className="perps-hot">HOT</em>}
                  {soon && <span className="perps-soon">Soon</span>}
                </button>
              );
            })}
          </div>
          <div className="perps-table">
            <table>
              <thead>
                <tr>
                  {[
                    "Time",
                    "Type",
                    "Coin",
                    "Direction",
                    "Size",
                    "Original Size",
                    "Order Value",
                    "Price",
                    "Reduce Only",
                    "Trigger Conditions",
                    "TP/SL",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1].map((i) => (
                  <tr key={i}>
                    <td>22:08 15/08</td>
                    <td>Limit</td>
                    <td>BTC</td>
                    <td className="up">Buy</td>
                    <td>0.00087</td>
                    <td>0.00087</td>
                    <td>92.25 USDC</td>
                    <td>111,783</td>
                    <td>No</td>
                    <td>N/A</td>
                    <td>--</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="perps-row">
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

/* ---------- PORTFOLIO ---------- */

/** Compact relative time for activity rows ("12m ago"). */
function relativeTime(unixSeconds: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PortfolioPage() {
  const session = useSession();
  const address = session?.wallet ?? null;
  const { portfolio, activity, trades, loading, error, refresh, updatedAt } = usePortfolioData(address);
  const [hidden, setHidden] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalUsd = Number(portfolio?.totalUsdValue ?? 0);
  const closedTrades = trades.filter((t) => t.pnl !== undefined);
  const wins = closedTrades.filter((t) => Number(t.pnl) > 0).length;
  const realizedPnl = closedTrades.reduce((sum, t) => sum + Number(t.pnl ?? 0), 0);
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : null;
  const volume = trades.reduce((sum, t) => sum + Number(t.quantity) * Number(t.price ?? 0), 0);

  /**
   * Every figure on this page is derived from real balances and real swaps.
   *
   * The allocation split and the concentration reading replace the decorative
   * "risk score" slider this page used to render — a full-width track that no
   * data ever moved, which read as a real metric without being one.
   */
  const allocation = useMemo(() => {
    const valued = (portfolio?.balances ?? [])
      .map((balance) => ({
        symbol: balance.symbol,
        amount: Number(balance.amount),
        usd: Number(balance.usdValue ?? 0),
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.usd - a.usd);
    const total = valued.reduce((sum, item) => sum + item.usd, 0);
    return valued.map((item) => ({ ...item, pct: total > 0 ? (item.usd / total) * 100 : 0 }));
  }, [portfolio]);

  const hasAllocation = allocation.some((item) => item.pct > 0);
  const concentrationPct = hasAllocation ? allocation[0].pct : null;
  const concentrationLabel =
    concentrationPct === null
      ? null
      : concentrationPct >= 70
        ? "Concentrated"
        : concentrationPct >= 40
          ? "Balanced"
          : "Diversified";

  const statCards: { label: string; value: string; tone?: "gain" | "loss"; meter?: number }[] = [
    {
      label: "Realized PnL",
      value: `${realizedPnl >= 0 ? "+" : "-"}$${Math.abs(realizedPnl).toFixed(2)}`,
      ...(realizedPnl > 0 ? { tone: "gain" as const } : realizedPnl < 0 ? { tone: "loss" as const } : {}),
    },
    { label: "Win Rate", value: winRate === null ? "—" : `${winRate.toFixed(0)}%`, ...(winRate === null ? {} : { meter: winRate }) },
    { label: "Volume", value: `$${volume.toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
    { label: "Trades", value: String(trades.length) },
  ];

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the address stays visible on screen */
    }
  };

  const refreshBalance = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await refresh();
    } finally {
      window.setTimeout(() => setSyncing(false), 400);
    }
  };

  if (!address) {
    return (
      <div className="app-page portfolio">
        <AppBar />
        <div className="pf-connect">
          <h1>Connect your wallet</h1>
          <p>Connect a wallet to view your on-chain portfolio.</p>
          <Link href="/auth" className="pf-connect-btn">
            Connect wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page portfolio">
      <AppBar />
      <div className="pf-wrap">
        <section className="pf-hero">
          <div className="pf-hero-main">
            <p className="pf-label">Wallet Value</p>
            <h1 className="pf-value">
              {hidden ? <span className="pf-masked">••••••••</span> : <>${formatUsd(totalUsd)}</>}
            </h1>
            <div className="pf-identity">
              <span className="pf-addr" title={address}>
                {address}
              </span>
              <button type="button" className="pf-mini" onClick={copyAddress} aria-label="Copy wallet address">
                {copied ? <CircleCheck size={13} /> : <Copy size={13} />}
              </button>
              <a
                className="pf-mini"
                href={arcExplorerAddressUrl(address)}
                target="_blank"
                rel="noreferrer"
                aria-label="View this wallet on the Arc explorer"
              >
                <ExternalLink size={13} />
              </a>
            </div>
            {error && <p className="pf-error">{error}</p>}
            {!error && (portfolio?.unavailableAssets ?? 0) > 0 && (
              <p className="pf-note">
                {portfolio?.unavailableAssets} asset balance
                {portfolio?.unavailableAssets === 1 ? "" : "s"} could not be read — totals below are partial.
              </p>
            )}
          </div>
          <div className="pf-hero-tools">
            <button
              type="button"
              className="pf-iconbtn"
              aria-label={hidden ? "Reveal value" : "Hide value"}
              aria-pressed={hidden}
              onClick={() => setHidden((value) => !value)}
            >
              {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              type="button"
              className={`pf-iconbtn${syncing ? " syncing" : ""}`}
              aria-label="Refresh balances"
              disabled={syncing}
              onClick={refreshBalance}
            >
              <RefreshCw size={15} />
            </button>
            <span className="pf-updated">
              {loading ? "Refreshing…" : updatedAt ? `Updated ${relativeTime(Math.floor(updatedAt / 1000))}` : "Live"}
            </span>
          </div>
        </section>

        {hasAllocation && (
          <section className="pf-card">
            <header className="pf-card-head">
              <h2>Asset allocation</h2>
              <span className="pf-muted pf-small">by USD value</span>
            </header>
            <div
              className="pf-alloc-track"
              role="img"
              aria-label={allocation.map((item) => `${item.symbol} ${item.pct.toFixed(0)}%`).join(", ")}
            >
              {allocation.map((item, index) => (
                <i key={item.symbol} className={`pf-seg-${index % 4}`} style={{ width: `${item.pct}%` }} />
              ))}
            </div>
            <ul className="pf-alloc-legend">
              {allocation.map((item, index) => (
                <li key={item.symbol}>
                  <span className={`pf-dot pf-seg-${index % 4}`} aria-hidden="true" />
                  <b>{item.symbol}</b>
                  <span className="pf-mono pf-muted">
                    {item.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                  </span>
                  <span className="pf-mono pf-pct">{item.pct.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pf-stats">
          {statCards.map((stat) => (
            <div key={stat.label} className="pf-stat">
              <span className="pf-label">{stat.label}</span>
              <b className={`pf-stat-value pf-mono${stat.tone ? ` ${stat.tone}` : ""}`}>{stat.value}</b>
              {stat.meter !== undefined && (
                <span className="pf-meter" aria-hidden="true">
                  <i style={{ width: `${Math.min(100, Math.max(0, stat.meter))}%` }} />
                </span>
              )}
            </div>
          ))}
        </section>

        <section className="pf-columns">
          <div className="pf-card">
            <header className="pf-card-head">
              <h2>Holdings</h2>
              <span className="pf-muted pf-small">
                {allocation.length} asset{allocation.length === 1 ? "" : "s"}
              </span>
            </header>
            {allocation.length === 0 ? (
              <div className="pf-empty-block">
                <p className="pf-empty-title">{loading ? "Reading balances from Arc…" : "No assets yet"}</p>
                <p className="pf-empty-body">
                  {loading
                    ? "Your holdings appear as soon as the chain responds."
                    : "Balances for USDC, EURC and cirBTC will show here once this wallet holds them on Arc mainnet."}
                </p>
                {!loading && (
                  <Link className="pf-empty-cta" href="/spot">
                    Swap on Spot
                  </Link>
                )}
              </div>
            ) : (
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Balance</th>
                    <th>Price</th>
                    <th>Value</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.map((item, index) => (
                    <tr key={item.symbol}>
                      <td>
                        <span className="pf-asset">
                          <TokenIcon symbol={item.symbol} />
                          <b>{item.symbol}</b>
                        </span>
                      </td>
                      <td className="pf-mono">{item.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}</td>
                      <td className="pf-mono pf-muted">
                        {item.amount > 0 && item.usd > 0 ? `$${formatUsd(item.usd / item.amount)}` : "—"}
                      </td>
                      <td className="pf-mono pf-strong">${formatUsd(item.usd)}</td>
                      <td>
                        <span className="pf-share">
                          <i className={`pf-seg-${index % 4}`} style={{ width: `${item.pct}%` }} />
                          <span className="pf-mono">{item.pct.toFixed(0)}%</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pf-card pf-concentration">
            <header className="pf-card-head">
              <h2>Concentration</h2>
            </header>
            {concentrationPct === null ? (
              <p className="pf-empty-body">Available once this wallet holds a valued asset.</p>
            ) : (
              <>
                <div
                  className="pf-gauge"
                  role="img"
                  aria-label={`Your largest holding is ${concentrationPct.toFixed(0)} percent of this portfolio`}
                >
                  {Array.from({ length: 24 }).map((_, index) => (
                    <i key={index} className={index < Math.round((concentrationPct / 100) * 24) ? "on" : ""} />
                  ))}
                </div>
                <p className="pf-gauge-label">
                  {concentrationLabel} <b className="pf-mono">{concentrationPct.toFixed(0)}%</b>
                </p>
                <p className="pf-empty-body">Share of value in your single largest holding.</p>
                <p className="pf-muted pf-small">Largest: {allocation[0].symbol}</p>
              </>
            )}
          </div>
        </section>

        <section className="pf-card">
          <header className="pf-card-head">
            <h2>Activity</h2>
            {activity.length > 0 && <span className="pf-muted pf-small">last {Math.min(8, activity.length)}</span>}
          </header>
          {activity.length === 0 ? (
            <div className="pf-empty-block">
              <p className="pf-empty-title">{loading ? "Reading on-chain history…" : "No activity yet"}</p>
              <p className="pf-empty-body">
                {loading
                  ? "Scanning recent Arc blocks for this wallet."
                  : "Swaps and transfers appear here after your first transaction."}
              </p>
            </div>
          ) : (
            <ul className="pf-activity">
              {activity.slice(0, 8).map((tx) => {
                const hash = tx.hash.split("-")[0];
                const isSwap = tx.type === "swap";
                return (
                  <li key={tx.hash} className={isSwap ? "swap" : ""}>
                    <span className="pf-act-glyph" aria-hidden="true">
                      {isSwap ? <ArrowRightLeft size={15} /> : <ArrowDownUp size={15} />}
                    </span>
                    <span className="pf-act-summary">{tx.summary}</span>
                    <span className="pf-act-time pf-mono">{relativeTime(tx.timestamp)}</span>
                    <a
                      className="pf-mini"
                      href={arcExplorerTxUrl(hash)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="View this transaction on the Arc explorer"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- SPOT ---------- */
interface SpotToken {
  symbol: string;
  address: string;
  decimals: number;
}

interface SpotQuote {
  outputAmount: string;
  minOut: string;
  venue: string;
  /** Tower's gas UNITS estimate — not a fee. */
  gasEstimate?: string;
  /** Arc's maxFeePerGas in 18-decimal USDC wei, from the API. */
  maxFeePerGasWei?: string | null;
}

export function SpotPage() {
  const session = useSession();
  const address = session?.wallet ?? null;
  const privy = usePrivyOptional();
  const wallets = useWalletsOptional();
  const { portfolio, trades } = usePortfolioData(address);

  const chainId = ARC_CHAIN_ID;
  const [tokens, setTokens] = useState<SpotToken[]>([]);
  const [fromSym, setFromSym] = useState("USDC");
  const [toSym, setToSym] = useState("EURC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SpotQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{
    fromSym: string;
    toSym: string;
    amountIn: string;
    amountOut: string;
    hash: string;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<"confirming" | "success" | "reverted" | "unconfirmed">(
    "confirming"
  );

  const fromToken = tokens.find((t) => t.symbol === fromSym);
  const toToken = tokens.find((t) => t.symbol === toSym);

  useEffect(() => {
    fetch("/api/tower/tokens")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data)) setTokens(json.data);
      })
      .catch(() => {});
  }, []);

  const balanceFor = (symbol: string) =>
    portfolio?.balances.find((b) => b.symbol.toUpperCase() === symbol.toUpperCase())?.amount;

  /**
   * USD price derived from the portfolio's own valuation (value / amount), so
   * the fiat hint is always backed by a real price rather than a hardcoded one.
   * Null when the asset is not held — then no hint is shown at all.
   */
  const priceOf = (symbol: string): number | null => {
    const balance = portfolio?.balances.find((b) => b.symbol.toUpperCase() === symbol.toUpperCase());
    if (!balance) return null;
    const held = Number(balance.amount);
    const usd = Number(balance.usdValue ?? 0);
    return held > 0 && usd > 0 ? usd / held : null;
  };

  const usdHint = (symbol: string, quantity: string): string | null => {
    const price = priceOf(symbol);
    const value = Number(quantity) * (price ?? 0);
    if (price === null || !(value > 0)) return null;
    return `~ $${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    const value = Number(amount);
    if (!fromToken || !toToken || fromSym === toSym || !(value > 0)) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setQuoting(true);
      setError(null);
      try {
        const inputAmount = ethers.parseUnits(amount, fromToken.decimals).toString();
        const res = await apiFetch("/api/v1/swap/quote", {
          method: "POST",
          noIdempotencyKey: true,
          body: JSON.stringify({
            inputToken: fromToken.address,
            outputToken: toToken.address,
            inputAmount,
            slippageTolerance: 50,
          }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(apiErrorMessage(json, "Could not get a quote"));
        const data = json.data;
        if (!data?.outputAmount) throw new Error("Could not get a quote");
        setQuote({
          outputAmount: data.outputAmount,
          minOut: data.minOut,
          venue: data.route?.hops?.[0]?.dexName ?? data.route?.hops?.[0]?.dexId ?? "tower",
          gasEstimate: data.gasEstimate,
          maxFeePerGasWei: data.maxFeePerGasWei ?? null,
        });
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(err instanceof Error ? err.message : "Could not get a quote");
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [amount, fromSym, toSym, fromToken, toToken, chainId]);

  const flip = () => {
    setFromSym(toSym);
    setToSym(fromSym);
    setAmount("");
    setQuote(null);
  };

  /**
   * Signs and sends through whichever wallet the user actually connected.
   *
   * Privy's `sendTransaction` only signs for PRIVY EMBEDDED wallets — calling it
   * for an injected wallet (MetaMask, OKX…) throws "User must have an embedded
   * wallet to send a transaction", which is exactly why swapping failed for
   * external-wallet accounts. Those wallets sign through their own EIP-1193
   * provider instead.
   */
  const sendTransaction = async (tx: {
    to: string;
    data: string;
    value?: string;
  }): Promise<string> => {
    const value = BigInt(tx.value ?? "0");
    const connected = wallets.find((w) => w.address?.toLowerCase() === address?.toLowerCase());

    if (connected?.walletClientType === "privy") {
      const receipt = (await privy!.sendTransaction({
        to: tx.to,
        data: tx.data,
        value,
        chainId,
      })) as { transactionHash?: string; hash?: string };
      return receipt?.transactionHash ?? receipt?.hash ?? "";
    }

    // External wallet: go through its provider.
    const injected = (window as unknown as { ethereum?: unknown }).ethereum;
    const getProvider = async (): Promise<{
      getNetwork: () => Promise<{ chainId: bigint | number }>;
      getSigner: (addr?: string) => Promise<ethers.Signer>;
    }> => {
      // Privy has shipped both of these accessors across 1.x, and the injected
      // provider is the final fallback, so an external wallet signs on whichever
      // version is installed.
      const wallet = connected as unknown as
        | {
            getEthersProvider?: () => Promise<never>;
            getEthereumProvider?: () => Promise<unknown>;
          }
        | undefined;

      if (typeof wallet?.getEthersProvider === "function") {
        return (await wallet.getEthersProvider.call(connected)) as never;
      }
      if (typeof wallet?.getEthereumProvider === "function") {
        const eip1193 = await wallet.getEthereumProvider.call(connected);
        return new ethers.BrowserProvider(eip1193 as never) as never;
      }
      if (!injected) {
        throw new Error("This wallet cannot sign transactions in the browser.");
      }
      return new ethers.BrowserProvider(injected as never) as never;
    };

    let provider = await getProvider();
    let network = await provider.getNetwork();

    if (Number(network.chainId) !== chainId) {
      const switcher = (connected as unknown as { switchChain?: (id: number) => Promise<void> } | undefined)
        ?.switchChain;
      if (typeof switcher === "function") {
        await switcher.call(connected, chainId);
        provider = await getProvider();
        network = await provider.getNetwork();
      }
      if (Number(network.chainId) !== chainId) {
        throw new Error(`Switch your wallet to Arc (chain ${chainId}) and try again.`);
      }
    }

    const signer = await provider.getSigner(address ?? undefined);
    const sent = await signer.sendTransaction({ to: tx.to, data: tx.data, value });
    await sent.wait();
    return sent.hash;
  };

  const runSwap = async () => {
    if (!address || !fromToken || !toToken || !(Number(amount) > 0)) return;
    if (!privy) {
      setError("Connect a wallet to swap.");
      return;
    }
    setSwapping(true);
    setError(null);
    setNotice(null);
    try {
      const inputAmount = ethers.parseUnits(amount, fromToken.decimals).toString();

      // Tower's build endpoint is intermittent on some networks, so retry with a
      // fresh quote. Each attempt is a NEW economic attempt, so it gets its own
      // idempotency key — reusing one would replay the previous build instead.
      let build:
        | { approval?: { to: string; data: string; value?: string } | null; swap: { to: string; data: string; value?: string } }
        | null = null;
      let builtQuote: { outputAmount?: string } | null = null;
      let lastError = "Tower could not build the swap transaction.";
      for (let attempt = 1; attempt <= 6 && !build; attempt++) {
        const quoteRes = await apiFetch("/api/v1/swap/quote", {
          method: "POST",
          noIdempotencyKey: true,
          body: JSON.stringify({
            inputToken: fromToken.address,
            outputToken: toToken.address,
            inputAmount,
            slippageTolerance: 50,
          }),
        });
        const quoteJson = await quoteRes.json();
        if (quoteRes.ok && quoteJson.data) {
          const buildRes = await apiFetch("/api/v1/swap/build", {
            method: "POST",
            idempotencyKey: newIdempotencyKey(),
            body: JSON.stringify({ quote: quoteJson.data, userAddress: address }),
          });
          const buildJson = await buildRes.json();
          const candidate = buildJson.data;
          if (buildRes.ok && candidate?.swap?.to && candidate?.swap?.data) {
            build = candidate;
            // The executed quote, not the one on screen — the build loop re-quotes.
            builtQuote = quoteJson.data;
            break;
          }
          lastError = apiErrorMessage(buildJson, lastError);
        } else {
          lastError = apiErrorMessage(quoteJson, lastError);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!build) throw new Error(lastError);

      if (build.approval) {
        await sendTransaction(build.approval);
      }
      const hash = await sendTransaction(build.swap);
      setCompleted({
        fromSym,
        toSym,
        amountIn: amount,
        // The quoted output for the transaction that was actually built.
        amountOut: builtQuote?.outputAmount
          ? Number(ethers.formatUnits(builtQuote.outputAmount, 18)).toFixed(6)
          : "—",
        hash,
      });
      setConfirmation("confirming");
      setNotice(null);
      setAmount("");
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setSwapping(false);
    }
  };

  /**
   * Confirms the swap on chain.
   *
   * A broadcast hash is not a completed swap, so the completion screen waits for
   * the receipt rather than assuming success. Arc finalises in under a second,
   * so this normally settles on the first poll.
   */
  useEffect(() => {
    if (!completed || confirmation !== "confirming") return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await apiFetch(`/api/v1/swap/status?hash=${completed.hash}`);
        const json = await res.json();
        if (cancelled) return;
        const status = json?.data?.status;
        if (status === "success") {
          setConfirmation("success");
          return;
        }
        if (status === "reverted") {
          setConfirmation("reverted");
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (cancelled) return;
      if (attempts >= 15) {
        setConfirmation("unconfirmed");
        return;
      }
      window.setTimeout(poll, 1200);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [completed, confirmation]);

  const outAmount = quote ? Number(ethers.formatUnits(quote.outputAmount, 18)) : 0;
  const minOut = quote ? Number(ethers.formatUnits(quote.minOut, 18)) : 0;
  const rate = quote && Number(amount) > 0 ? outAmount / Number(amount) : 0;
  const sellBalance = balanceFor(fromSym);
  const buyBalance = balanceFor(toSym);
  const hasAmount = Number(amount) > 0;

  /**
   * Every supported asset, joined with whatever the portfolio actually returned.
   * A missing entry means the chain did not answer for it, so it shows "—"
   * rather than a zero that would look like a real balance.
   */
  const assetRows = tokens.map((token) => {
    const balance = portfolio?.balances.find(
      (b) => b.symbol.toUpperCase() === token.symbol.toUpperCase()
    );
    return {
      symbol: token.symbol,
      balance: balance ? balance.amount : null,
      value: balance?.usdValue ?? null,
    };
  });

  /**
   * Network fee in USDC.
   *
   * Arc prices gas in 18-decimal USDC wei, so gasLimit × maxFeePerGas is
   * already a dollar figure — no price lookup needed, and per Arc's own
   * guidance the UI never says "Gwei" or "ETH".
   */
  const networkFeeUsdc = (() => {
    if (!quote?.gasEstimate || !quote.maxFeePerGasWei) return null;
    try {
      return Number(ethers.formatUnits(BigInt(quote.gasEstimate) * BigInt(quote.maxFeePerGasWei), 18));
    } catch {
      return null;
    }
  })();
  const networkFeeLabel =
    networkFeeUsdc === null
      ? "—"
      : networkFeeUsdc < 0.000001
        ? "< 0.000001 USDC"
        : `~${networkFeeUsdc.toFixed(6)} USDC`;

  const buttonLabel = !address
    ? "Connect wallet to swap"
    : swapping
      ? "Swapping…"
      : !hasAmount
        ? "Enter an amount"
        : quoting
          ? "Getting quote…"
          : quote
            ? `Swap ${fromSym} for ${toSym}`
            : "No route available";

  return (
    <div className="app-page spot">
      <AppBar />
      <main className="spot-shell">
        <div className="spot-tabs">
          <button type="button" className="on">
            Swap
          </button>
        </div>

        <div className="spot-grid">
          <section className="spot-ticket">
            {completed ? (
              <div className="spot-card spot-done">
                <span
                  className={`spot-done-glyph${
                    confirmation === "reverted" ? " bad" : confirmation === "success" ? " ok" : ""
                  }`}
                  aria-hidden="true"
                >
                  {confirmation === "reverted" ? <CircleX size={26} /> : <CircleCheck size={26} />}
                </span>
                <h2 className="spot-done-title">
                  {confirmation === "success"
                    ? "Swap completed"
                    : confirmation === "reverted"
                      ? "Swap reverted"
                      : confirmation === "unconfirmed"
                        ? "Swap submitted"
                        : "Confirming on Arc…"}
                </h2>
                <p className="spot-done-sub">
                  {confirmation === "reverted"
                    ? "The transaction was included but failed on chain, so nothing was swapped."
                    : confirmation === "success"
                      ? "Finalised on Arc mainnet."
                      : confirmation === "unconfirmed"
                        ? "Taking longer than usual — the explorer will show the outcome."
                        : "Arc finalises in under a second."}
                </p>

                <p className="spot-done-amount">
                  <span>
                    {completed.amountIn} {completed.fromSym}
                  </span>
                  <ArrowRightLeft size={16} aria-hidden="true" />
                  <b>
                    {completed.amountOut} {completed.toSym}
                  </b>
                </p>

                <dl className="spot-details">
                  <div>
                    <dt>Transaction</dt>
                    <dd>
                      <a
                        className="spot-done-link"
                        href={arcExplorerTxUrl(completed.hash)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {completed.hash.slice(0, 10)}…{completed.hash.slice(-6)}
                        <ExternalLink size={12} />
                      </a>
                    </dd>
                  </div>
                </dl>

                <button
                  className="spot-swap"
                  type="button"
                  onClick={() => {
                    setCompleted(null);
                    setConfirmation("confirming");
                    setError(null);
                    setNotice(null);
                  }}
                >
                  Swap again
                </button>
              </div>
            ) : (
              <>
            <div className="spot-card">
              <div className="spot-panel-head">
                <span className="spot-label">Sell</span>
                <span className="spot-bal">
                  Balance {sellBalance ?? "—"} {fromSym}
                  {sellBalance && Number(sellBalance) > 0 ? (
                    <button
                      type="button"
                      className="spot-max"
                      onClick={() => setAmount(sellBalance)}
                    >
                      Max
                    </button>
                  ) : null}
                </span>
              </div>
              <div className="spot-panel">
                <label className="spot-token">
                  <TokenIcon symbol={fromSym} />
                  <select
                    value={fromSym}
                    onChange={(e) => {
                      setFromSym(e.target.value);
                      setQuote(null);
                    }}
                    aria-label="Sell token"
                  >
                    {tokens.map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.symbol}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} aria-hidden="true" />
                </label>
                <input
                  className="spot-amt"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label="Sell amount"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
              <p className="spot-hint">{usdHint(fromSym, amount) ?? ""}</p>
            </div>

            <div className="spot-flip-wrap">
              <button className="spot-flip" aria-label="Switch tokens" onClick={flip}>
                <ArrowDownUp size={18} />
              </button>
            </div>

            <div className="spot-card">
              <div className="spot-panel-head">
                <span className="spot-label">Buy</span>
                <span className="spot-bal">
                  Balance {buyBalance ?? "—"} {toSym}
                </span>
              </div>
              <div className="spot-panel">
                <label className="spot-token">
                  <TokenIcon symbol={toSym} />
                  <select
                    value={toSym}
                    onChange={(e) => {
                      setToSym(e.target.value);
                      setQuote(null);
                    }}
                    aria-label="Buy token"
                  >
                    {tokens.map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.symbol}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} aria-hidden="true" />
                </label>
                <span className={`spot-amt readonly${quote ? "" : " empty"}`}>
                  {quote ? outAmount.toFixed(6) : "0.00"}
                </span>
              </div>
              <p className="spot-hint">
                {quote ? (usdHint(toSym, String(outAmount)) ?? "") : ""}
              </p>
            </div>

            <dl className="spot-details">
              <div>
                <dt>Rate</dt>
                <dd>{quote ? `1 ${fromSym} = ${rate.toFixed(6)} ${toSym}` : "—"}</dd>
              </div>
              <div>
                <dt>Minimum received</dt>
                <dd>{quote ? `${minOut.toFixed(6)} ${toSym}` : "—"}</dd>
              </div>
              <div>
                <dt>Network fee</dt>
                <dd
                  title={
                    quote?.gasEstimate ? `${Number(quote.gasEstimate).toLocaleString()} gas` : undefined
                  }
                >
                  {networkFeeLabel}
                </dd>
              </div>
            </dl>

            {error && <p className="pf-error">{error}</p>}
            {notice && <p className="spot-ok">{notice}</p>}

            <button
              className="spot-swap"
              type="button"
              onClick={runSwap}
              disabled={!address || !quote || swapping || !hasAmount}
            >
              {buttonLabel}
            </button>
              </>
            )}
          </section>

          <aside className="spot-side">
            <div className="pf-card">
              <header className="pf-card-head">
                <h2>Route</h2>
                <span className="pf-muted pf-small">{quote ? quote.venue : "Auto-routed"}</span>
              </header>
              <div className="spot-flow">
                <div className="spot-flow-row">
                  <span className="pf-muted pf-small">You pay</span>
                  <b className="pf-mono">{hasAmount ? `${amount} ${fromSym}` : `0.00 ${fromSym}`}</b>
                </div>
                <span className="spot-flow-line" aria-hidden="true" />
                <div className="spot-flow-row">
                  <span className="pf-muted pf-small">You receive</span>
                  <b className="pf-mono">
                    {quote ? `${outAmount.toFixed(6)} ${toSym}` : `0.00 ${toSym}`}
                  </b>
                </div>
              </div>
              <div className="spot-pills">
                <span className="spot-pill">Tower</span>
                <span className="spot-pill">{quote ? quote.venue : "Auto-routed"}</span>
                <span className="spot-pill">50 bps slippage</span>
              </div>
              <p className="pf-empty-body spot-note">
                The venue, rate and minimum received are always shown before you sign.
              </p>
            </div>

            <div className="pf-card">
              <header className="pf-card-head">
                <h2>Your assets</h2>
                {(portfolio?.unavailableAssets ?? 0) > 0 && (
                  <span className="pf-muted pf-small">{portfolio?.unavailableAssets} unreadable</span>
                )}
              </header>
              {assetRows.length === 0 ? (
                <p className="pf-empty-body">Loading supported assets…</p>
              ) : (
                <table className="pf-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Balance</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetRows.map((row) => (
                      <tr key={row.symbol}>
                        <td>
                          <span className="pf-asset">
                            <TokenIcon symbol={row.symbol} />
                            <b>{row.symbol}</b>
                          </span>
                        </td>
                        <td className="pf-mono">
                          {row.balance === null
                            ? "—"
                            : Number(row.balance).toLocaleString("en-US", { maximumFractionDigits: 6 })}
                        </td>
                        <td className="pf-mono pf-muted">
                          {row.value ? `$${Number(row.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </aside>
        </div>

        <section className="pf-card">
          <header className="pf-card-head">
            <h2>Recent swaps</h2>
            <Link className="pf-muted pf-small" href="/portfolio">
              View all
            </Link>
          </header>
          {trades.length === 0 ? (
            <div className="pf-empty-block">
              <p className="pf-empty-title">No swaps yet</p>
              <p className="pf-empty-body">
                Your swaps will appear here after your first trade. This wallet needs USDC on Arc
                mainnet to get started.
              </p>
            </div>
          ) : (
            <ul className="pf-activity">
              {trades.slice(0, 5).map((trade, index) => (
                <li key={`${trade.timestamp}-${index}`} className="swap">
                  <span className="pf-act-glyph" aria-hidden="true">
                    <ArrowRightLeft size={15} />
                  </span>
                  <span className="pf-act-summary">
                    {trade.symbol} · {Number(trade.quantity).toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
                    at {Number(trade.price ?? 0).toFixed(6)}
                  </span>
                  <span className="pf-act-time pf-mono">{relativeTime(trade.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

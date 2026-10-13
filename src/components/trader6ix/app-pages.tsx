"use client";

import Link from "next/link";
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
  ArrowUpDown,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Copy,
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
import { usePrivyOptional } from "@/components/trader6ix/privy-auth";
import logo from "@/assets/trader6ix-logo.png.asset.json";

/* ---------- shared app bar ---------- */
const appLinks = [
  { to: "/spot", label: "Spot" },
  { to: "/perps", label: "Perpetual" },
  { to: "/portfolio", label: "Portfolio" },
] as const;

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
  const [notifs, setNotifs] = useState([
    {
      id: 1,
      title: "Order filled",
      body: "Buy 0.00087 BTC filled at 111,783 USDC",
      time: "2m ago",
      read: false,
    },
    {
      id: 2,
      title: "Funding payment",
      body: "You paid 0.0008% funding on BTC-USDC",
      time: "18m ago",
      read: false,
    },
    {
      id: 3,
      title: "Price alert",
      body: "BTC-USDC crossed above 92,000 USDC",
      time: "1h ago",
      read: false,
    },
    {
      id: 4,
      title: "Faucet deposit",
      body: "2,000 testnet USDC received from the faucet",
      time: "Yesterday",
      read: true,
    },
  ]);
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
        <button className="app-icon-btn" aria-label="Search">
          <Search size={18} />
        </button>
        <a
          className="app-icon-btn"
          href="https://faucet.circle.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="Open the testnet faucet"
          title="Get testnet USDC from the Circle faucet"
        >
          <Icon iconNode={faucetNode} size={18} />
        </a>
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
            onClick={() => setWalletOpen((v) => !v)}
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
export function PortfolioPage() {
  const session = useSession();
  const address = session?.wallet ?? null;
  const { portfolio, activity, trades, loading, error, refresh } = usePortfolioData(address);
  const [range, setRange] = useState("6m");
  const [hidden, setHidden] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const totalUsd = Number(portfolio?.totalUsdValue ?? 0);
  const closedTrades = trades.filter((t) => t.pnl !== undefined);
  const wins = closedTrades.filter((t) => Number(t.pnl) > 0).length;
  const realizedPnl = closedTrades.reduce((sum, t) => sum + Number(t.pnl ?? 0), 0);
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : null;
  const volume = trades.reduce((sum, t) => sum + Number(t.quantity) * Number(t.price ?? 0), 0);

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
      <div className="pf-grid">
        <section>
          <div className="pf-head">
            <div>
              <p className="pf-label">Wallet Value</p>
              <h1>
                {hidden ? (
                  <span className="pf-masked">••••••••</span>
                ) : (
                  <>
                    $
                    {totalUsd.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </>
                )}
              </h1>
              {error && <p className="pf-error">{error}</p>}
            </div>
            <div className="pf-tools">
              <div className="pf-icons">
                <button
                  type="button"
                  aria-label={hidden ? "Reveal balance" : "Hide balance"}
                  aria-pressed={hidden}
                  onClick={() => setHidden((v) => !v)}
                >
                  {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  aria-label="Refresh balance"
                  className={syncing ? "syncing" : ""}
                  disabled={syncing}
                  onClick={refreshBalance}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="pf-ranges">
                {["1h", "8h", "1d", "1w", "1m", "6m", "1y"].map((r) => (
                  <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="pf-chart">
            <p className="pf-chart-empty">
              {loading ? "Loading portfolio…" : "Historical value chart isn't available yet."}
            </p>
          </div>
          <div className="pf-stats">
            {[
              ["Realized PnL", `${realizedPnl >= 0 ? "+" : "-"}$${Math.abs(realizedPnl).toFixed(2)}`],
              ["Win Rate", winRate === null ? "—" : `${winRate.toFixed(1)}%`],
              ["Volume", `$${volume.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
              ["Trades", String(trades.length)],
            ].map(([label, value]) => (
              <div key={label} className="pf-stat">
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>
        <aside>
          <div className="pf-risk-head">
            <h2>
              Portfolio
              <br />
              Risk Score
            </h2>
            <small>
              Updated:
              <br />
              Just Now
            </small>
          </div>
          <div className="pf-risk">
            <i style={{ width: "0%" }} />
          </div>
          <div className="pf-risk-labels">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
          <div className="pf-tx-head">
            <h3>Transactions</h3>
            <button>View All</button>
          </div>
          <div className="pf-tx-grid">
            {activity.length === 0 ? (
              <p className="pf-empty">{loading ? "Loading transactions…" : "No transactions yet."}</p>
            ) : (
              activity.slice(0, 6).map((tx) => (
                <div key={tx.hash} className="pf-tx">
                  <div className="pf-tx-top">
                    <div>
                      {tx.type}
                      <small>{new Date(tx.timestamp * 1000).toLocaleString()}</small>
                    </div>
                  </div>
                  <div className="pf-tx-amt">
                    <b>{tx.summary}</b>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- SPOT ---------- */
export function SpotPage() {
  const [tab, setTab] = useState("Swap");
  const [flip, setFlip] = useState(false);
  const [sell, setSell] = useState("10");
  const a = { sym: "ETH", bal: "342,343.564 ETH", amt: sell },
    b = { sym: "USDC", bal: "224.32 USDC", amt: "3424" };
  const [top, bottom] = flip ? [b, a] : [a, b];
  return (
    <div className="app-page spot">
      <AppBar />
      <main className="spot-main">
        <div className="spot-tabs">
          {["Swap", "Send", "Buy"].map((t) => {
            const isSoon = t !== "Swap";
            return (
              <button
                key={t}
                type="button"
                className={tab === t ? "on" : ""}
                disabled={isSoon}
                aria-disabled={isSoon}
                title={isSoon ? "Coming soon" : undefined}
                onClick={() => setTab(t)}
              >
                {t}
                {isSoon && <span className="spot-soon">Soon</span>}
              </button>
            );
          })}
        </div>
        <div className="spot-card">
          <p className="spot-label">SELL</p>
          <div className="spot-row">
            <div>
              <button className="spot-token">
                <TokenIcon symbol={top.sym} />
                {top.sym}
                <ChevronDown size={18} />
              </button>
              <p className="spot-bal">
                <Wallet size={14} /> {top.bal}
              </p>
            </div>
            <input
              className="spot-amt"
              value={top.amt}
              onChange={(e) => setSell(e.target.value)}
              aria-label="Sell amount"
              inputMode="decimal"
            />
          </div>
          <div className="spot-row">
            <button className="spot-max">MAX</button>
            <span className="spot-usd">
              ~ $26,869.55 <ArrowUpDown size={14} />
            </span>
          </div>
        </div>
        <button className="spot-flip" aria-label="Switch tokens" onClick={() => setFlip(!flip)}>
          <ArrowDownUp size={22} />
        </button>
        <div className="spot-card">
          <p className="spot-label">BUY</p>
          <div className="spot-row">
            <div>
              <button className="spot-token">
                <TokenIcon symbol={bottom.sym} />
                {bottom.sym}
                <ChevronDown size={18} />
              </button>
              <p className="spot-bal">
                <Wallet size={14} /> {bottom.bal}
              </p>
            </div>
            <span className="spot-amt">{bottom.amt}</span>
          </div>
          <div className="spot-row end">
            <span className="spot-usd">~ $26,869.55</span>
          </div>
        </div>
        <dl className="spot-details">
          <div>
            <dt>
              Route <Info size={16} />
            </dt>
            <dd>
              <span className="spot-best">Best Rate</span> ~ 1 min <ChevronDown size={14} />
            </dd>
          </div>
          <div>
            <dt>
              Minimum Received <Info size={16} />
            </dt>
            <dd>
              ~ 1 min <Pencil size={14} />
            </dd>
          </div>
          <div>
            <dt>
              Rate <Info size={16} />
            </dt>
            <dd>
              ~ 1 min <Pencil size={14} />
            </dd>
          </div>
          <div>
            <dt>
              Network Fee <Info size={16} />
            </dt>
            <dd>0.000518 USDC ($0.1066)</dd>
          </div>
        </dl>
        <button className="spot-swap">{tab}</button>
      </main>
    </div>
  );
}

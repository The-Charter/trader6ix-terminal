"use client";

import { isRevealPath } from "./page-reveal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import { clearSession, useSession } from "@/components/trader6ix/session";
import { usePrivyOptional } from "@/components/trader6ix/privy-auth";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "@/components/trader6ix/connect-wallet-button";
import logo from "@/assets/trader6ix-logo.png.asset.json";

const mainLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Features", to: "/features" },
] as const;
const headerLinks = [
  ...mainLinks,
  { label: "FAQ", to: "/faq" },
] as const;
function SoonLink({ label, className }: { label: string; className?: string }) {
  return (
    <span className={`soon-link ${className ?? ""}`} aria-disabled="true" title="Coming soon">
      {label}
      <span className="site-soon">Soon</span>
    </span>
  );
}
export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const session = useSession();
  const router = useRouter();
  const privy = usePrivyOptional();
  const signOut = () => {
    clearSession();
    void privy?.logout().catch(() => {});
    setMenu(false);
    router.replace("/");
  };
  return (
    <header
      className={`site-header ${pathname === "/" || isRevealPath(pathname) ? "from-top" : ""}`}
    >
      <nav className="nav-shell" aria-label="Main navigation">
        <Link href="/" className="brand" aria-label="Trader6ix home" onClick={() => setMenu(false)}>
          <img src={logo.url} alt="Trader6ix" />
        </Link>
        <div className={`nav-links ${menu ? "mobile-open" : ""}`}>
          {headerLinks.map((l) => {
            const current = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                href={l.to}
                className={current ? "active" : undefined}
                aria-current={current ? "page" : undefined}
                onClick={() => setMenu(false)}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        {session ? (
          <>
            <Button variant="hero" className="quote-button" asChild>
              <Link href="/spot" onClick={() => setMenu(false)}>
                Open App
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="signout-button"
              onClick={signOut}
              aria-label="Sign out"
            >
              <LogOut />
            </Button>
          </>
        ) : (
          <ConnectWalletButton
            variant="hero"
            className="quote-button"
            onClick={() => setMenu(false)}
          >
            Connect Wallet
          </ConnectWalletButton>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="mobile-menu-button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Close menu" : "Open menu"}
        >
          {menu ? <X /> : <Menu />}
        </Button>
      </nav>
    </header>
  );
}
// Copyright year for the footer, so it never goes stale.
function currentYear(): number {
  return new Date().getFullYear();
}
export function SiteFooter() {
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  return (
    <footer className="site-footer site-container">
      <div className="footer-top">
        <div>
          <Link href="/" className="footer-brand">
            <img src={logo.url} alt="" />
            <span>Trader6ix</span>
          </Link>
          <h2>Onchain Trading, Without The Compromise</h2>
          <p>
            A trader-focused terminal bringing multiple markets and onchain liquidity into one
            familiar trading environment. Still being built.
          </p>
        </div>
        <form
          className="newsletter"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const value = email.trim();
            if (!value) {
              setError("Please enter your email address.");
              setNotice("");
              return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              setError("Please enter a valid email address.");
              setNotice("");
              return;
            }
            setError("");
            setNotice("Newsletter subscriptions are not connected yet.");
          }}
        >
          <label htmlFor="newsletter-email">Subscribe to our newsletter</label>
          <div className={`newsletter-input${error ? " has-error" : ""}`}>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Enter your email"
              aria-label="Email address"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "newsletter-email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
            />
            <Button variant="ghost" size="icon" aria-label="Subscribe" type="submit">
              <ArrowRight />
            </Button>
          </div>
          {error && (
            <p role="alert" id="newsletter-email-error" className="field-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="newsletter-message">
              {notice}
            </p>
          )}
        </form>
      </div>
      <div className="footer-links">
        <div className="footer-column">
          <h3>Quick Links</h3>
          {mainLinks.map((l) => (
              <Link key={l.to} href={l.to}>
                {l.label}
              </Link>
            ))}
          <SoonLink label="Career" />
        </div>
        <div className="footer-column">
          <h3>Company</h3>
          <SoonLink label="Integration" />
          <Link href="/faq">FAQ</Link>
        </div>
        <div className="footer-column">
          <h3>Social</h3>
          {["Facebook", "Instagram", "LinkedIn", "Twitter"].map((n) => (
            <a key={n} href="#">
              {n}
            </a>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {currentYear()} Trader6ix. All rights reserved.</span>
      </div>
    </footer>
  );
}

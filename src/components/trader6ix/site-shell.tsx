"use client";

import { isRevealPath } from "./page-reveal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { clearSession, useSession } from "@/components/trader6ix/session";
import { usePrivyOptional } from "@/components/trader6ix/privy-auth";
import { Button } from "@/components/ui/button";
import logo from "@/assets/trader6ix-logo.png.asset.json";

const mainLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Features", to: "/features" },
  { label: "Sign Up", to: "/auth" },
] as const;
const headerLinks = mainLinks.filter((l) => l.to !== "/auth");
const pageLinks = [
  { label: "Blog And News", to: "/blog", soon: false },
  { label: "Integration", to: "/integration", soon: true },
  { label: "Career", to: "/career", soon: true },
  { label: "FAQ", to: "/faq", soon: false },
  { label: "Contact Us", to: "/contact", soon: false },
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
  const [pages, setPages] = useState(false);
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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openPages = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setPages(true);
  };
  const closePages = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPages(false), 200);
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
          {headerLinks.map((l) => (
            <Link key={l.to} href={l.to} onClick={() => setMenu(false)}>
              {l.label}
            </Link>
          ))}
          <div className="pages-menu" onMouseEnter={openPages} onMouseLeave={closePages}>
            <Button
              variant="ghost"
              className="pages-trigger"
              onClick={() => {
                if (closeTimer.current) {
                  clearTimeout(closeTimer.current);
                  closeTimer.current = null;
                }
                setPages(!pages);
              }}
              aria-expanded={pages}
            >
              Pages <ChevronDown size={12} />
            </Button>
            {pages && (
              <div className="pages-popover">
                {pageLinks.map((l) =>
                  l.soon ? (
                    <SoonLink key={l.to} label={l.label} />
                  ) : (
                    <Link
                      key={l.to}
                      href={l.to}
                      onClick={() => {
                        setPages(false);
                        setMenu(false);
                      }}
                    >
                      {l.label}
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
        {session ? (
          <>
            <Button variant="hero" className="quote-button" asChild>
              <Link href="/perps" onClick={() => setMenu(false)}>
                Go to Perps
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
          <Button variant="hero" className="quote-button" asChild>
            <Link href="/auth" onClick={() => setMenu(false)}>
              Sign Up
            </Link>
          </Button>
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
          <h2>Conquer the Markets With Confidence</h2>
          <p>
            Customize your trading experience with Trader6ix’s unified terminal, combining real-time
            market data, advanced analytics, risk-management tools, and seamless trade execution in
            one powerful dashboard.
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
          {mainLinks
            .filter((l) => l.to != "/auth")
            .map((l) => (
              <Link key={l.to} href={l.to}>
                {l.label}
              </Link>
            ))}
          <SoonLink label="Career" />
          <Link href="/contact">Contact Us</Link>
        </div>
        <div className="footer-column">
          <h3>Company</h3>
          <Link href="/blog">Blog And News</Link>
          <SoonLink label="Integration" />
          <Link href="/faq">FAQ</Link>
          <SoonLink label="Career" />
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

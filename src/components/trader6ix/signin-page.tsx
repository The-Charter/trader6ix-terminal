"use client";

// ============= Auth page (single authentication screen) =============

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/trader6ix-logo.png.asset.json";
import { images } from "@/assets/images";
import background from "@/assets/signup-background.png.asset.json";
import portrait from "@/assets/signup-wei.png.asset.json";
import { AUTH_REDIRECT_PATH, useSession } from "@/components/trader6ix/session";
import { PRIVY_ENABLED, usePrivyOptional } from "@/components/trader6ix/privy-auth";

const languages = ["ENG", "BNG", "Hindi"] as const;

function LanguageSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<(typeof languages)[number]>("ENG");
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  return (
    <div className={`signup-lang${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="signup-lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((o) => !o)}
      >
        {value}
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Language" className="signup-lang-menu">
          {languages.map((lang) => (
            <li key={lang} role="option" aria-selected={value === lang}>
              <button
                type="button"
                className={`signup-lang-option${value === lang ? " is-selected" : ""}`}
                onClick={() => {
                  setValue(lang);
                  setOpen(false);
                }}
              >
                {lang}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const authReviews = [
  {
    quote:
      "The team collaboration feature has enhanced communication, making project updates seamless and minimizing misunderstandings.",
    name: "Linda Gomez",
    role: "Product Manager / Innovator",
    image: portrait.url,
  },
  {
    quote:
      "Trader6ix puts everything on one screen — live charts, open positions, and risk tools. I can review a setup and execute in seconds.",
    name: "Sarah Mitchell",
    role: "Swing Trader",
    image: images[9],
  },
  {
    quote:
      "Practising with real market data gave me the confidence to size positions properly before risking anything.",
    name: "David Chen",
    role: "Day Trader",
    image: images[10],
  },
];

export function SignInPage() {
  const router = useRouter();
  const session = useSession();
  const privy = usePrivyOptional();
  const [emailError, setEmailError] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewLeaving, setReviewLeaving] = useState(false);
  const [reviewPaused, setReviewPaused] = useState(false);
  useEffect(() => {
    if (reviewPaused) return;
    const id = window.setInterval(() => setReviewLeaving(true), 6000);
    return () => window.clearInterval(id);
  }, [reviewPaused]);
  useEffect(() => {
    if (!reviewLeaving) return;
    const id = window.setTimeout(() => {
      setReviewIndex((i) => (i + 1) % authReviews.length);
      setReviewLeaving(false);
    }, 350);
    return () => window.clearTimeout(id);
  }, [reviewLeaving]);
  // A written session — mirrored from Privy by PrivySessionSync — is the single
  // signal that sign-in completed.
  useEffect(() => {
    if (session) router.replace(AUTH_REDIRECT_PATH);
  }, [session, router]);
  const connectWallet = () => {
    // login(), not connectWallet(): connectWallet only LINKS another wallet to an
    // already-authenticated user. Signing in needs login(), which authenticates
    // (and creates the account on first use).
    if (PRIVY_ENABLED && privy) privy.login();
  };
  const continueWithEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    if (PRIVY_ENABLED && privy) privy.login({ prefill: { type: "email", value: email } });
  };

  return (
    <main className="signup-page signin-page">
      <section className="signup-scene">
        <img className="signup-background" src={background.url} alt="" />
        <div className="signup-layout site-container">
          <div className="signup-panel">
            <div className="signup-panel-top">
              <Link href="/" aria-label="Trader6ix home">
                <img src={logo.url} alt="Trader6ix" />
              </Link>
            </div>
            <div className="signup-content">
              <div className="signup-user">
                <UserRound aria-hidden="true" />
              </div>
              <h1>Sign in to your account</h1>
              <Button variant="outline" className="signup-wallet" onClick={connectWallet}>
                <Wallet aria-hidden="true" />
                Connect Wallet
              </Button>
              <div className="signup-divider">
                <span>Or</span>
              </div>
              <form className="signup-register" noValidate onSubmit={continueWithEmail}>
                <div className={`signup-field${emailError ? " has-error" : ""}`}>
                  <div className="signup-email-wrap">
                    <label className="sr-only" htmlFor="signin-email">
                      Email
                    </label>
                    <input
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="Continue with email."
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? "signin-email-error" : undefined}
                      onChange={() => {
                        if (emailError) setEmailError("");
                      }}
                    />
                    <button
                      className="signup-arrow"
                      type="submit"
                      aria-label="Sign in with this email"
                    >
                      <ArrowRight aria-hidden="true" />
                    </button>
                  </div>
                  {emailError && (
                    <span role="alert" id="signin-email-error" className="field-error">
                      {emailError}
                    </span>
                  )}
                </div>
                <Button className="signup-submit" type="submit">
                  <ArrowRight aria-hidden="true" />
                  Continue with email
                </Button>
              </form>
            </div>
            <div className="signup-panel-bottom">
              <span>© 2026 Trader6ix’s</span>
              <LanguageSelect />
            </div>
          </div>
          <figure
            key={reviewIndex}
            className={`signup-testimonial${reviewLeaving ? " is-leaving" : " is-entering"}`}
            onMouseEnter={() => setReviewPaused(true)}
            onMouseLeave={() => setReviewPaused(false)}
          >
            <img src={authReviews[reviewIndex]?.image} alt={authReviews[reviewIndex]?.name} />
            <blockquote>{authReviews[reviewIndex]?.quote}</blockquote>
            <figcaption>
              <strong>{authReviews[reviewIndex]?.name}</strong>
              <span>{authReviews[reviewIndex]?.role}</span>
            </figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}

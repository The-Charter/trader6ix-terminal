"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Eyebrow } from "./sections";
import hero from "@/assets/about-hero.png.asset.json";

export function ContactHero() {
  return (
    <section className="int-hero faqpage-hero">
      <img className="int-backdrop" src={hero.url} alt="" />
      <div className="site-container int-hero-content">
        <Eyebrow>Contact Us</Eyebrow>
        <h1>Hit us up!</h1>
        <p>
          Where tech gets wild, coffee sparks debates, and we act like we’ve got it all figured out
          (but in a cool way).
        </p>
      </div>
    </section>
  );
}

const inquiryTypes = [
  "General Inquiry",
  "Technical Support",
  "Partnerships",
  "Feature Request",
  "Report a Bug",
  "Other",
];

function ProjectTypeSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
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
    <div className="form-field">
      <span id="inquiry-type-label">Select an Inquiry Type</span>
      <div className={`custom-select${open ? " is-open" : ""}`} ref={rootRef}>
        <input type="hidden" name="inquiry-type" value={value} />
        <button
          type="button"
          className="custom-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby="inquiry-type-label inquiry-type-value"
          onClick={() => setOpen((o) => !o)}
        >
          <span id="inquiry-type-value" className={value ? "" : "custom-select-placeholder"}>
            {value || "Select…"}
          </span>
          <ChevronDown aria-hidden="true" />
        </button>
        {open && (
          <ul role="listbox" aria-labelledby="inquiry-type-label" className="custom-select-menu">
            {inquiryTypes.map((t) => (
              <li key={t} role="option" aria-selected={value === t}>
                <button
                  type="button"
                  className={`custom-select-option${value === t ? " is-selected" : ""}`}
                  onClick={() => {
                    setValue(t);
                    setOpen(false);
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ContactForm() {
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; subject?: string }>({});
  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  return (
    <section className="site-container contactpage-form">
      <form
        className="contact-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const name = String(data.get("name") ?? "").trim();
          const email = String(data.get("email") ?? "").trim();
          const subject = String(data.get("subject") ?? "").trim();
          const next: typeof errors = {};
          if (!name) next.name = "Please enter your name.";
          if (!email) next.email = "Please enter your email address.";
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            next.email = "Please enter a valid email address.";
          if (!subject) next.subject = "Please enter a subject.";
          setErrors(next);
          if (Object.keys(next).length > 0) {
            setNotice("");
            return;
          }
          setNotice(
            "This contact form is not connected to a delivery service yet. Your message has not been sent.",
          );
        }}
      >
        <label className={`form-field${errors.name ? " has-error" : ""}`}>
          Full Name
          <input
            autoComplete="name"
            name="name"
            required
            placeholder="Your name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            onChange={() => clearError("name")}
          />
          {errors.name && (
            <span role="alert" id="contact-name-error" className="field-error">
              {errors.name}
            </span>
          )}
        </label>
        <label className={`form-field${errors.email ? " has-error" : ""}`}>
          Email
          <input
            autoComplete="email"
            name="email"
            type="email"
            required
            placeholder="Your email address"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            onChange={() => clearError("email")}
          />
          {errors.email && (
            <span role="alert" id="contact-email-error" className="field-error">
              {errors.email}
            </span>
          )}
        </label>
        <label className="form-field">
          Phone
          <input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number" />
        </label>
        <label className={`form-field${errors.subject ? " has-error" : ""}`}>
          Subject
          <input
            name="subject"
            required
            placeholder="How can we help?"
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "contact-subject-error" : undefined}
            onChange={() => clearError("subject")}
          />
          {errors.subject && (
            <span role="alert" id="contact-subject-error" className="field-error">
              {errors.subject}
            </span>
          )}
        </label>
        <ProjectTypeSelect />
        <label className="form-field form-field-wide">
          Message (Optional)
          <textarea name="message" placeholder="Write your message" />
        </label>
        <Button variant="orange" size="hero" type="submit">
          Send Now <ArrowUpRight />
        </Button>
        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}
      </form>
    </section>
  );
}

export function ContactPage() {
  return (
    <main className="contactpage">
      <ContactHero />
      <ContactForm />
    </main>
  );
}

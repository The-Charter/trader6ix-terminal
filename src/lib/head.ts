"use client";

import { useEffect } from "react";

export type PageMeta = {
  /** Full document title. Callers append the brand suffix when they want it. */
  title: string;
  description: string;
};

/** Appends the Trader6ix suffix used by every page except the home page. */
export function brandTitle(title: string): string {
  return `${title} — Trader6ix`;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Applies the page's title and social meta tags on the client. Replaces the
 * server-rendered `head()` option of the previous router.
 */
export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("name", "twitter:card", "summary_large_image");
  }, [title, description]);
}

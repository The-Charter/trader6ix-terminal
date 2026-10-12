"use client";

import { useEffect } from "react";

export const revealPaths = [
  "/about",
  "/features",
  "/integration",
  "/blog",
  "/career",
  "/faq",
  "/contact",
];

export function isRevealPath(path: string) {
  return revealPaths.some((p) => path === p || path.startsWith(p + "/"));
}

/** Gives inner pages the landing-page entry: first block slides in from the left, the rest rise up on scroll. */
export function usePageReveal(path: string) {
  useEffect(() => {
    if (!isRevealPath(path)) return;
    const main = document.querySelector("main");
    if (!main) return;
    const blocks = (Array.from(main.children) as HTMLElement[]).filter(
      (el) => !el.classList.contains("int-backdrop"),
    );
    // Pages wrapped in one section container: animate that container's children instead.
    const targets =
      blocks.length === 1 && blocks[0] ? (Array.from(blocks[0].children) as HTMLElement[]) : blocks;
    const [first, ...rest] = targets;
    first?.classList.add("enter-left");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    rest.forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
    return () => io.disconnect();
  }, [path]);
}

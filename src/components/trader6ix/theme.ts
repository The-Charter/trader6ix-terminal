"use client";

import { useSyncExternalStore } from "react";

import { THEME_ATTR as ATTR, THEME_STORAGE_KEY as STORAGE_KEY } from "@/lib/theme-bootstrap";

/** Theme of the signed-in area (Spot / Perpetual / Portfolio). */
export type AppTheme = "dark" | "light";

export { THEME_BOOTSTRAP } from "@/lib/theme-bootstrap";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of [...listeners]) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** Keeps <html> in step with the theme so the CSS rules apply immediately. */
export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  if (theme === "light") document.documentElement.setAttribute(ATTR, "light");
  else document.documentElement.removeAttribute(ATTR);
}

export function setTheme(theme: AppTheme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — the theme still applies for this visit */
  }
  applyTheme(theme);
  notify();
}

export function toggleTheme() {
  setTheme(readTheme() === "light" ? "dark" : "light");
}

export function useTheme(): AppTheme {
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}

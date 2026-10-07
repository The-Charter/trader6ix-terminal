"use client";

export function EconomicCalendarPanel() {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-2">Economic Calendar</p>
      <p className="text-xs text-ink-3">
        Not connected to a live data source yet — no invented events are shown here. Forex Factory&apos;s calendar is
        the intended source once a permitted, machine-readable feed is integrated.
      </p>
      <a
        href="https://www.forexfactory.com/calendar"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-accent hover:text-ink"
      >
        View official calendar on Forex Factory ↗
      </a>
    </div>
  );
}

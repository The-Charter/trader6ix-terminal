"use client";

import { ADAPTERS } from "@/lib/adapters/registry";

export function VenueSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (ADAPTERS.length <= 1) {
    // Nothing to switch between yet — show the single connected venue as a
    // plain label instead of a dropdown with one disabled option.
    return (
      <span className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400">
        Venue: {ADAPTERS[0]?.displayName ?? "None connected"}
      </span>
    );
  }

  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
    >
      {ADAPTERS.map((a) => (
        <option key={a.id} value={a.id}>
          {a.displayName}
        </option>
      ))}
    </select>
  );
}

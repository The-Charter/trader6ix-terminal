"use client";

interface VenueLike {
  id: string;
  displayName: string;
  isLive: boolean;
}

export function VenueSelector({
  adapters,
  selectedId,
  onSelect,
}: {
  adapters: VenueLike[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (adapters.length <= 1) {
    const only = adapters[0];
    return (
      <span className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-ink-2">
        Venue: {only?.displayName ?? "None connected"}
      </span>
    );
  }

  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className="rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-ink"
    >
      {adapters.map((a) => (
        <option key={a.id} value={a.id}>
          {a.displayName}
          {!a.isLive ? " (coming soon)" : ""}
        </option>
      ))}
    </select>
  );
}

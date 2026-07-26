import type { ExchangeAdapter } from "./types";
import { hibachiAdapter } from "./hibachi-adapter";
import { onchainAdapterTemplate } from "./onchain-adapter-template";

/**
 * Every connected venue lives here. Adding a real second venue is: build its
 * adapter file (copy onchain-adapter-template.ts or hibachi-adapter.ts as a
 * starting point), then add it to this array — nothing else in the app needs
 * to change, since every component talks to the `ExchangeAdapter` interface,
 * never to a specific venue's API/contract shape directly.
 */
export const ADAPTERS: ExchangeAdapter[] = [
  hibachiAdapter,
  // onchainAdapterTemplate is intentionally left out of the active list until
  // it's pointed at a real deployed protocol — an unconfigured adapter in the
  // venue picker would just be a broken option for users to click.
];

export function getAdapter(id: string): ExchangeAdapter | undefined {
  return ADAPTERS.find((a) => a.id === id);
}

export const DEFAULT_ADAPTER_ID = ADAPTERS[0].id;

// Exported for reference/testing when wiring in a new venue — not part of the
// active registry above.
export { onchainAdapterTemplate };

import { ARC_CHAIN_NAME } from "@/lib/arc-network";

/**
 * Which perpetuals venue the terminal is configured for, in one place.
 *
 * Trader6ix has no provider-selection mechanism yet — Hibachi is the single
 * configured provider. UI copy reads from here instead of hardcoding a venue
 * name in each component, so swapping or adding a supported perpetuals DEX later
 * is a change to this file (plus the integration itself), not a UI hunt.
 *
 * The network comes from the app's Arc configuration, so the label stays
 * accurate if the chain config changes. Nothing here implies a connection is
 * live; it only names the configured venue.
 */
export type PerpsProvider = {
  id: string;
  /** Display name of the underlying perpetuals DEX. */
  name: string;
  /** Network the venue settles on. */
  network: string;
};

export const ACTIVE_PERPS_PROVIDER: PerpsProvider = {
  id: "hibachi",
  name: "Hibachi",
  network: ARC_CHAIN_NAME,
};

/**
 * Whether perpetuals trading is operational for users. While false, Perps
 * History must show an honest "not available yet" state: no records are read,
 * borrowed from the spot swap feed, or invented. Flip this only together with a
 * real provider history source (see `usePerpsHistory`).
 */
export const PERPS_TRADING_AVAILABLE = false;

/** e.g. "Hibachi on Arc" */
export function perpsVenueLabel(provider: PerpsProvider = ACTIVE_PERPS_PROVIDER): string {
  return `${provider.name} on ${provider.network}`;
}

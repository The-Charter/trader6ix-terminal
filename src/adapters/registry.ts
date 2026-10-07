import type { PerpsAdapter } from "./perps-adapter";
import type { FXAdapter } from "./fx-adapter";
import type { SpotAdapter } from "./spot-adapter";
import type { DataAdapter } from "./data-adapter";

import { hibachiAdapter } from "./hibachi-adapter";
import { stableFxAdapter } from "./stablefx-adapter";
import { towerAdapter } from "./tower-adapter";
import { goldskyDataAdapter } from "./goldsky-data-adapter";

/**
 * Concrete adapters per category. Every entry is a real venue integration — the
 * UI only ever talks to the adapter interfaces, never to a specific venue.
 *
 * A venue that is not configured (missing credentials, or a paused integration)
 * reports `isLive: false` from its adapter and the UI renders an unavailable
 * state. No simulated data is ever substituted for real data.
 */
export const PERPS_ADAPTERS: PerpsAdapter[] = [hibachiAdapter];
export const FX_ADAPTERS: FXAdapter[] = [stableFxAdapter];
export const SPOT_ADAPTERS: SpotAdapter[] = [towerAdapter];
export const DATA_ADAPTERS: DataAdapter[] = [goldskyDataAdapter];

export function getPerpsAdapter(id: string) {
  return PERPS_ADAPTERS.find((a) => a.id === id);
}
export function getFxAdapter(id: string) {
  return FX_ADAPTERS.find((a) => a.id === id);
}
export function getSpotAdapter(id: string) {
  return SPOT_ADAPTERS.find((a) => a.id === id);
}
export function getDataAdapter(id: string) {
  return DATA_ADAPTERS.find((a) => a.id === id);
}

export const DEFAULT_PERPS_ADAPTER_ID = PERPS_ADAPTERS[0].id;
export const DEFAULT_FX_ADAPTER_ID = FX_ADAPTERS[0].id;
export const DEFAULT_SPOT_ADAPTER_ID = SPOT_ADAPTERS[0].id;
export const DEFAULT_DATA_ADAPTER_ID = DATA_ADAPTERS[0].id;

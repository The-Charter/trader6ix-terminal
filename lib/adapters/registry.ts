import type { PerpsAdapter } from "./perps-adapter";
import type { FXAdapter } from "./fx-adapter";
import type { SpotAdapter } from "./spot-adapter";
import type { DataAdapter } from "./data-adapter";

import { hibachiAdapter } from "./hibachi-adapter";
import { stableFxAdapter } from "./stablefx-adapter";
import { curveAdapter } from "./curve-adapter";
import { goldskyDataAdapter } from "./goldsky-data-adapter";

/**
 * The single place every venue in Trader6ix gets registered, organized by
 * the four adapter domains. Adding a new venue: write its adapter file
 * (implementing PerpsAdapter/FXAdapter/SpotAdapter/DataAdapter), add it to
 * the matching array below — nothing else in the app changes.
 */
export const PERPS_ADAPTERS: PerpsAdapter[] = [hibachiAdapter];
export const FX_ADAPTERS: FXAdapter[] = [stableFxAdapter];
export const SPOT_ADAPTERS: SpotAdapter[] = [curveAdapter];
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

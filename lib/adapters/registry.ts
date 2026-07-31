import type { PerpsAdapter } from "./perps-adapter";
import type { FXAdapter } from "./fx-adapter";
import type { SpotAdapter } from "./spot-adapter";
import type { DataAdapter } from "./data-adapter";

import { hibachiAdapter } from "./hibachi-adapter";
import { stableFxAdapter } from "./stablefx-adapter";
import { curveAdapter } from "./curve-adapter";
import { goldskyDataAdapter } from "./goldsky-data-adapter";

import { mockPerpsAdapter } from "./mock/mock-perps-adapter";
import { mockSpotAdapter } from "./mock/mock-spot-adapter";
import { mockFxAdapter } from "./mock/mock-fx-adapter";

/**
 * DEMO_MODE controls which concrete adapter powers each category. In demo
 * mode, the UI runs entirely against simulated data (clearly marked as such
 * everywhere it surfaces) so the product can be shown end-to-end even while
 * Hibachi/Curve/StableFX are still being finalized. Flip
 * NEXT_PUBLIC_DEMO_MODE=false once the real integrations are trustworthy —
 * no other code changes needed, since every component only ever talks to the
 * adapter interface, never to a specific venue.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false"; // defaults to true

export const PERPS_ADAPTERS: PerpsAdapter[] = DEMO_MODE ? [mockPerpsAdapter, hibachiAdapter] : [hibachiAdapter];
export const FX_ADAPTERS: FXAdapter[] = DEMO_MODE ? [mockFxAdapter, stableFxAdapter] : [stableFxAdapter];
export const SPOT_ADAPTERS: SpotAdapter[] = DEMO_MODE ? [mockSpotAdapter, curveAdapter] : [curveAdapter];
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

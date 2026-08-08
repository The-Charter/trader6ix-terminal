/**
 * Per-instrument trading specs. Values here are for the demo perpetual
 * markets we actually run (BTC-PERP/ETH-PERP/SOL-PERP). When a real
 * PerpsAdapter market is selected, its own contract spec should come from
 * that venue's exchange-info response — this table is the fallback/demo
 * source, not a claim about any specific live venue's actual contract terms.
 */

export type AssetClass = "crypto-perp" | "fx" | "metal";

export interface InstrumentSpec {
  symbol: string;
  assetClass: AssetClass;
  quoteCurrency: string;
  baseCurrency: string;
  /** Smallest price movement that counts as one "pip"/"point" for this instrument. */
  pipSize: number;
  /** Decimal places to display prices at. */
  pricePrecision: number;
  /** Smallest order-size increment. */
  quantityStep: number;
  maxLeverage: number;
}

export const INSTRUMENT_SPECS: Record<string, InstrumentSpec> = {
  "BTC-PERP": {
    symbol: "BTC-PERP",
    assetClass: "crypto-perp",
    quoteCurrency: "USD",
    baseCurrency: "BTC",
    pipSize: 1, // $1 move, since crypto perps don't use FX-style pips
    pricePrecision: 1,
    quantityStep: 0.001,
    maxLeverage: 20,
  },
  "ETH-PERP": {
    symbol: "ETH-PERP",
    assetClass: "crypto-perp",
    quoteCurrency: "USD",
    baseCurrency: "ETH",
    pipSize: 0.1,
    pricePrecision: 2,
    quantityStep: 0.01,
    maxLeverage: 20,
  },
  "SOL-PERP": {
    symbol: "SOL-PERP",
    assetClass: "crypto-perp",
    quoteCurrency: "USD",
    baseCurrency: "SOL",
    pipSize: 0.01,
    pricePrecision: 3,
    quantityStep: 0.1,
    maxLeverage: 20,
  },
};

export function getInstrumentSpec(symbol: string): InstrumentSpec {
  return (
    INSTRUMENT_SPECS[symbol] ?? {
      symbol,
      assetClass: "crypto-perp",
      quoteCurrency: "USD",
      baseCurrency: symbol.split("-")[0] ?? symbol,
      pipSize: 0.01,
      pricePrecision: 2,
      quantityStep: 0.01,
      maxLeverage: 10,
    }
  );
}

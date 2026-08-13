import { getInstrumentSpec } from "./instrument-specs";

export interface RiskCalcInput {
  symbol: string;
  balance: number;
  entry: number;
  stopLoss: number;
  mode: "lots" | "leverage";
  /** Used in "lots" mode */
  riskPct?: number;
  /** Used in "leverage" mode */
  leverage?: number;
}

export interface RiskCalcResult {
  riskAmount: number;
  positionSize: number; // in units of the base asset
  lots?: number; // FX only — positionSize / contractSize (e.g. 100,000 units = 1.00 standard lot)
  notional: number;
  impliedLeverage: number;
  marginRequired: number;
  marginIsMinimum: boolean; // true when marginRequired reflects the instrument's max leverage (risk% mode has no chosen leverage, so this is the floor, not a firm number)
  stopDistance: number;
  stopDistanceInPips: number;
  pipValue: number;
  potentialLoss: number;
  potentialProfitAtTakeProfit?: number;
  riskRewardRatio?: number;
}

/**
 * Real position-size math, modeled on the standard risk-management approach
 * (the same one tools like Myfxbook's calculator use): risk a fixed % of
 * account balance, size the position so a stop-out loses exactly that amount.
 * Respects each instrument's own pip size/precision instead of assuming
 * every asset behaves like EUR/USD.
 */
export function calculateRisk(input: RiskCalcInput, takeProfit?: number): RiskCalcResult {
  const spec = getInstrumentSpec(input.symbol);
  const stopDistance = Math.abs(input.entry - input.stopLoss);
  const stopDistanceInPips = spec.pipSize > 0 ? stopDistance / spec.pipSize : stopDistance;

  let positionSize: number;
  let riskAmount: number;

  if (input.mode === "lots") {
    const riskPct = input.riskPct ?? 1;
    riskAmount = input.balance * (riskPct / 100);
    positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;
  } else {
    const leverage = input.leverage ?? 1;
    const notionalFromLeverage = input.balance * leverage;
    positionSize = input.entry > 0 ? notionalFromLeverage / input.entry : 0;
    riskAmount = positionSize * stopDistance;
  }

  // Round to the instrument's tradable increment
  positionSize = Math.round(positionSize / spec.quantityStep) * spec.quantityStep;

  const notional = positionSize * input.entry;
  const impliedLeverage = input.balance > 0 ? notional / input.balance : 0;

  // Margin required: in leverage mode you explicitly chose a leverage, so
  // margin = notional / that leverage — a firm number. In risk% mode, no
  // leverage was chosen, so we show the minimum margin possible (at the
  // instrument's max allowed leverage) and flag it as a floor, not a promise —
  // a trader using less leverage than max would need more margin than this.
  const marginIsMinimum = input.mode === "lots";
  const effectiveLeverageForMargin = input.mode === "leverage" ? input.leverage ?? 1 : spec.maxLeverage;
  const marginRequired = effectiveLeverageForMargin > 0 ? notional / effectiveLeverageForMargin : notional;

  const pipValue = stopDistanceInPips > 0 ? riskAmount / stopDistanceInPips : 0;
  const potentialLoss = positionSize * stopDistance;
  const lots = spec.contractSize ? positionSize / spec.contractSize : undefined;

  let potentialProfitAtTakeProfit: number | undefined;
  let riskRewardRatio: number | undefined;
  if (takeProfit !== undefined && takeProfit > 0) {
    const tpDistance = Math.abs(takeProfit - input.entry);
    potentialProfitAtTakeProfit = positionSize * tpDistance;
    riskRewardRatio = potentialLoss > 0 ? potentialProfitAtTakeProfit / potentialLoss : undefined;
  }

  return {
    riskAmount,
    positionSize,
    lots,
    notional,
    impliedLeverage,
    marginRequired,
    marginIsMinimum,
    stopDistance,
    stopDistanceInPips,
    pipValue,
    potentialLoss,
    potentialProfitAtTakeProfit,
    riskRewardRatio,
  };
}

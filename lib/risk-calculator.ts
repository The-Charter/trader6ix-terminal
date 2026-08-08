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
  notional: number;
  impliedLeverage: number;
  marginRequired: number;
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
  const marginRequired = spec.maxLeverage > 0 ? notional / spec.maxLeverage : notional;
  const impliedLeverage = input.balance > 0 ? notional / input.balance : 0;
  const pipValue = stopDistanceInPips > 0 ? riskAmount / stopDistanceInPips : 0;
  const potentialLoss = positionSize * stopDistance;

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
    notional,
    impliedLeverage,
    marginRequired,
    stopDistance,
    stopDistanceInPips,
    pipValue,
    potentialLoss,
    potentialProfitAtTakeProfit,
    riskRewardRatio,
  };
}

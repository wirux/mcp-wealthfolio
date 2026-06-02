import { describe, expect, it } from "vitest";
import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Currency } from "../value-objects/currency.js";
import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";
import { Drift } from "./drift.js";
import { RebalancingPlan } from "./rebalancing-plan.js";
import { TargetAllocation } from "./target-allocation.js";

const usd = Currency.create("USD");
const money = (amount: number) => Money.of(amount, usd);
const percentage = (value: number) => Percentage.create(value);

function createDrift(symbol: string, currentWeight: number, targetWeight: number, deltaValue: number): Drift {
  return Drift.create({
    symbol: AssetSymbol.create(symbol),
    currentWeight: percentage(currentWeight),
    targetWeight: percentage(targetWeight),
    deltaValue: money(deltaValue),
  });
}

describe("RebalancingPlan", () => {
  it("sorts drifts by absolute drift descending", () => {
    const drifts = [
      createDrift("BND", 0.28, 0.3, 20),
      createDrift("AAPL", 0.5, 0.2, -300),
      createDrift("VXUS", 0.22, 0.3, 80),
    ];

    const plan = RebalancingPlan.create({
      drifts,
      totalValue: money(1000),
      targetAllocation: TargetAllocation.create({ AAPL: 0.2, VXUS: 0.3, BND: 0.5 }),
    });

    expect(plan.drifts.map((drift) => drift.symbol.value)).toEqual(["AAPL", "VXUS", "BND"]);
  });

  it("breaks ties by symbol alphabetically", () => {
    const drifts = [
      createDrift("MSFT", 0.5, 0.25, -250),
      createDrift("AAPL", 0, 0.25, 250),
    ];

    const plan = RebalancingPlan.create({
      drifts,
      totalValue: money(1000),
      targetAllocation: TargetAllocation.create({ AAPL: 0.3, MSFT: 0.7 }),
    });

    expect(plan.drifts.map((drift) => drift.symbol.value)).toEqual(["AAPL", "MSFT"]);
  });

  it("stores cashToInvest when provided", () => {
    const cashToInvest = money(500);

    const plan = RebalancingPlan.create({
      drifts: [createDrift("AAPL", 0.2, 0.4, 200)],
      totalValue: money(1000),
      cashToInvest,
      targetAllocation: TargetAllocation.create({ AAPL: 1 }),
    });

    expect(plan.cashToInvest).toBe(cashToInvest);
  });

  it("leaves cashToInvest undefined when omitted", () => {
    const plan = RebalancingPlan.create({
      drifts: [createDrift("AAPL", 0.2, 0.4, 200)],
      totalValue: money(1000),
      targetAllocation: TargetAllocation.create({ AAPL: 1 }),
    });

    expect(plan.cashToInvest).toBeUndefined();
  });

  it("does not mutate the original drifts array", () => {
    const drifts = [
      createDrift("BND", 0.28, 0.3, 20),
      createDrift("AAPL", 0.5, 0.2, -300),
    ];
    const originalOrder = drifts.map((drift) => drift.symbol.value);

    RebalancingPlan.create({
      drifts,
      totalValue: money(1000),
      targetAllocation: TargetAllocation.create({ AAPL: 0.2, BND: 0.8 }),
    });

    expect(drifts.map((drift) => drift.symbol.value)).toEqual(originalOrder);
  });
});

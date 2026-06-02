import { describe, expect, it } from "vitest";
import { Drift } from "../domain/entities/drift.js";
import { Holding } from "../domain/entities/holding.js";
import { InvalidTargetAllocationError } from "../domain/errors/invalid-target-allocation-error.js";
import { ValidationError } from "../domain/errors/validation-error.js";
import { AssetSymbol } from "../domain/value-objects/asset-symbol.js";
import { Currency } from "../domain/value-objects/currency.js";
import { Money } from "../domain/value-objects/money.js";
import { Percentage } from "../domain/value-objects/percentage.js";
import { Quantity } from "../domain/value-objects/quantity.js";
import { ComputeRebalancingUseCase } from "./compute-rebalancing.js";

const usd = Currency.create("USD");

function createHolding(symbol: string, marketValueAmount: number): Holding {
  return Holding.create({
    id: `holding-${symbol}`,
    accountId: "account-1",
    symbol: AssetSymbol.create(symbol),
    quantity: Quantity.holding(1),
    marketValue: Money.of(marketValueAmount, usd),
    costBasis: Money.of(marketValueAmount, usd),
    unrealizedGainLoss: Money.of(0, usd),
    unrealizedGainLossPercent: Percentage.create(0),
    weight: Percentage.create(0),
  });
}

function serializeDrift(drift: Drift) {
  return {
    symbol: drift.symbol.value,
    currentWeight: drift.currentWeight.value,
    targetWeight: drift.targetWeight.value,
    driftPercent: drift.driftPercent,
    deltaValue: drift.deltaValue.amount,
    action: drift.action,
  };
}

describe("ComputeRebalancingUseCase", () => {
  it("computes basic rebalancing deltas", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [
        createHolding("AAPL", 5000),
        createHolding("MSFT", 3000),
        createHolding("GOOG", 2000),
      ],
      targetWeights: { AAPL: 0.4, MSFT: 0.35, GOOG: 0.25 },
    });

    expect(plan.totalValue.amount).toBe(10000);
    expect(plan.drifts.map((drift) => [drift.symbol.value, drift.action, drift.deltaValue.amount])).toEqual([
      ["AAPL", "sell", -1000],
      ["GOOG", "buy", 500],
      ["MSFT", "buy", 500],
    ]);
  });

  it("sorts by absolute drift descending and then symbol ascending", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [
        createHolding("AAPL", 5000),
        createHolding("MSFT", 3000),
        createHolding("GOOG", 2000),
      ],
      targetWeights: { AAPL: 0.4, MSFT: 0.35, GOOG: 0.25 },
    });

    expect(plan.drifts.map((drift) => drift.symbol.value)).toEqual(["AAPL", "GOOG", "MSFT"]);
    expect(plan.drifts[0]?.absoluteDrift).toBeCloseTo(0.1);
    expect(plan.drifts[1]?.absoluteDrift).toBeCloseTo(0.05);
    expect(plan.drifts[2]?.absoluteDrift).toBeCloseTo(0.05);
  });

  it("creates buy drift for target symbol missing from holdings", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [createHolding("AAPL", 1000)],
      targetWeights: { AAPL: 0.5, NVDA: 0.5 },
    });

    const nvdaDrift = plan.drifts.find((drift) => drift.symbol.value === "NVDA");
    expect(nvdaDrift?.action).toBe("buy");
    expect(nvdaDrift?.deltaValue.amount).toBe(500);
    expect(nvdaDrift?.currentWeight.value).toBe(0);
    expect(nvdaDrift?.targetWeight.value).toBe(0.5);
  });

  it("creates sell drift to zero for holding missing from targets", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [createHolding("AAPL", 1000)],
      targetWeights: { MSFT: 1 },
    });

    const aaplDrift = plan.drifts.find((drift) => drift.symbol.value === "AAPL");
    expect(aaplDrift?.action).toBe("sell");
    expect(aaplDrift?.deltaValue.amount).toBe(-1000);
    expect(aaplDrift?.targetWeight.value).toBe(0);
  });

  it("distributes cash only across positive drifts without sells", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [createHolding("AAPL", 5000), createHolding("MSFT", 5000)],
      targetWeights: { AAPL: 0.6, MSFT: 0.4 },
      cashToInvest: 1000,
    });

    expect(plan.totalValue.amount).toBe(11000);
    expect(plan.drifts).toHaveLength(1);
    expect(plan.drifts[0]?.symbol.value).toBe("AAPL");
    expect(plan.drifts[0]?.action).toBe("buy");
    expect(plan.drifts[0]?.deltaValue.amount).toBe(1000);
  });

  it("allows target sums at 0.999 tolerance boundary and rejects 0.998", () => {
    const useCase = new ComputeRebalancingUseCase();

    expect(() => useCase.execute({
      holdings: [createHolding("AAPL", 1000)],
      targetWeights: { AAPL: 0.999 },
    })).not.toThrow();

    expect(() => useCase.execute({
      holdings: [createHolding("AAPL", 1000)],
      targetWeights: { AAPL: 0.998 },
    })).toThrow(InvalidTargetAllocationError);
  });

  it("returns empty plan for empty portfolio with no cash to invest", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [],
      targetWeights: { AAPL: 1 },
    });

    expect(plan.totalValue.amount).toBe(0);
    expect(plan.totalValue.currency.code).toBe("USD");
    expect(plan.drifts).toEqual([]);
  });

  it("throws ValidationError for negative cashToInvest", () => {
    const useCase = new ComputeRebalancingUseCase();

    expect(() => useCase.execute({
      holdings: [createHolding("AAPL", 1000)],
      targetWeights: { AAPL: 1 },
      cashToInvest: -1,
    })).toThrow(ValidationError);
  });

  it("is deterministic for identical inputs", () => {
    const useCase = new ComputeRebalancingUseCase();
    const params = {
      holdings: [
        createHolding("AAPL", 5000),
        createHolding("MSFT", 3000),
        createHolding("GOOG", 2000),
      ],
      targetWeights: { AAPL: 0.4, MSFT: 0.35, GOOG: 0.25 },
      cashToInvest: 1000,
    };

    const first = useCase.execute(params);
    const second = useCase.execute(params);

    expect({
      totalValue: first.totalValue.amount,
      drifts: first.drifts.map(serializeDrift),
    }).toEqual({
      totalValue: second.totalValue.amount,
      drifts: second.drifts.map(serializeDrift),
    });
  });

  it("returns hold when a single holding is already at target", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [createHolding("AAPL", 1000)],
      targetWeights: { AAPL: 1 },
    });

    expect(plan.drifts).toHaveLength(1);
    expect(plan.drifts[0]?.action).toBe("hold");
    expect(plan.drifts[0]?.driftPercent).toBeCloseTo(0);
    expect(plan.drifts[0]?.deltaValue.amount).toBe(0);
  });

  it("uses USD as default currency for cash-only portfolios", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [],
      targetWeights: { AAPL: 0.5, MSFT: 0.5 },
      cashToInvest: 1000,
    });

    expect(plan.totalValue.currency.code).toBe("USD");
    expect(plan.drifts.map((drift) => [drift.symbol.value, drift.deltaValue.amount])).toEqual([
      ["AAPL", 500],
      ["MSFT", 500],
    ]);
  });

  it("scales multiple positive drifts to exactly the cash amount", () => {
    const useCase = new ComputeRebalancingUseCase();

    const plan = useCase.execute({
      holdings: [createHolding("AAPL", 7000), createHolding("MSFT", 3000)],
      targetWeights: { AAPL: 0.5, MSFT: 0.3, GOOG: 0.2 },
      cashToInvest: 1000,
    });

    expect(plan.drifts.every((drift) => drift.action === "buy")).toBe(true);
    expect(plan.drifts.reduce((sum, drift) => sum + drift.deltaValue.amount, 0)).toBe(1000);
    expect(plan.drifts.map((drift) => [drift.symbol.value, drift.deltaValue.amount])).toEqual([
      ["GOOG", 880],
      ["MSFT", 120],
    ]);
  });
});

import { describe, it, expect } from "vitest";
import { PerformanceSummary } from "./performance-summary.js";
import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";
import { Currency } from "../value-objects/currency.js";

const usd = Currency.create("USD");
const money = (amount: number) => Money.of(amount, usd);
const pct = (value: number) => Percentage.create(value);

describe("PerformanceSummary", () => {
  it("creates with required fields only", () => {
    const summary = PerformanceSummary.create({
      totalValue: money(10000),
      totalGainLoss: money(500),
      totalGainLossPercent: pct(0.05),
    });
    expect(summary.totalValue.amount).toBe(10000);
    expect(summary.totalGainLoss.amount).toBe(500);
    expect(summary.totalGainLossPercent.value).toBe(0.05);
  });

  it("creates with optional twr and mwr", () => {
    const summary = PerformanceSummary.create({
      totalValue: money(10000),
      totalGainLoss: money(500),
      totalGainLossPercent: pct(0.05),
      twr: pct(0.04),
      mwr: pct(0.045),
    });
    expect(summary.twr?.value).toBe(0.04);
    expect(summary.mwr?.value).toBe(0.045);
  });

  it("creates with period", () => {
    const summary = PerformanceSummary.create({
      totalValue: money(10000),
      totalGainLoss: money(500),
      totalGainLossPercent: pct(0.05),
      period: { from: "2024-01-01", to: "2024-12-31" },
    });
    expect(summary.period?.from).toBe("2024-01-01");
    expect(summary.period?.to).toBe("2024-12-31");
  });

  it("optional fields absent when not provided", () => {
    const summary = PerformanceSummary.create({
      totalValue: money(10000),
      totalGainLoss: money(500),
      totalGainLossPercent: pct(0.05),
    });
    expect(summary.twr).toBeUndefined();
    expect(summary.mwr).toBeUndefined();
    expect(summary.period).toBeUndefined();
  });
});

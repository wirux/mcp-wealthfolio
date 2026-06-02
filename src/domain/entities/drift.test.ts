import { describe, expect, it } from "vitest";
import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Currency } from "../value-objects/currency.js";
import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";
import { Drift } from "./drift.js";

const usd = Currency.create("USD");
const symbol = AssetSymbol.create("AAPL");
const money = (amount: number) => Money.of(amount, usd);
const percentage = (value: number) => Percentage.create(value);

describe("Drift", () => {
  it("sets action to buy when deltaValue is positive", () => {
    const drift = Drift.create({
      symbol,
      currentWeight: percentage(0.2),
      targetWeight: percentage(0.3),
      deltaValue: money(100),
    });

    expect(drift.action).toBe("buy");
  });

  it("sets action to sell when deltaValue is negative", () => {
    const drift = Drift.create({
      symbol,
      currentWeight: percentage(0.4),
      targetWeight: percentage(0.2),
      deltaValue: money(-50),
    });

    expect(drift.action).toBe("sell");
  });

  it("sets action to hold when deltaValue is zero", () => {
    const drift = Drift.create({
      symbol,
      currentWeight: percentage(0.25),
      targetWeight: percentage(0.25),
      deltaValue: money(0),
    });

    expect(drift.action).toBe("hold");
  });

  it("computes signed driftPercent as target minus current", () => {
    const drift = Drift.create({
      symbol,
      currentWeight: percentage(0.35),
      targetWeight: percentage(0.2),
      deltaValue: money(-150),
    });

    expect(drift.driftPercent).toBeCloseTo(-0.15);
  });

  it("returns absoluteDrift as a positive number", () => {
    const drift = Drift.create({
      symbol,
      currentWeight: percentage(0.8),
      targetWeight: percentage(0.1),
      deltaValue: money(-250),
    });

    expect(drift.absoluteDrift).toBeCloseTo(0.7);
    expect(drift.absoluteDrift).toBeGreaterThanOrEqual(0);
  });
});

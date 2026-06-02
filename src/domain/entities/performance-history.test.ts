import { describe, it, expect } from "vitest";
import { PerformanceHistory } from "./performance-history.js";
import { Money } from "../value-objects/money.js";
import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Currency } from "../value-objects/currency.js";

const usd = Currency.create("USD");
const money = (amount: number) => Money.of(amount, usd);

describe("PerformanceHistory", () => {
  it("creates with dataPoints", () => {
    const history = PerformanceHistory.create({
      dataPoints: [
        { date: "2024-01-01", value: money(10000) },
        { date: "2024-06-01", value: money(11000) },
      ],
    });
    expect(history.dataPoints).toHaveLength(2);
    expect(history.dataPoints[0]!.date).toBe("2024-01-01");
    expect(history.dataPoints[1]!.value.amount).toBe(11000);
  });

  it("creates with benchmark", () => {
    const history = PerformanceHistory.create({
      dataPoints: [{ date: "2024-01-01", value: money(10000) }],
      benchmark: {
        symbol: AssetSymbol.create("SPY"),
        dataPoints: [{ date: "2024-01-01", value: money(450) }],
      },
    });
    expect(history.benchmark?.symbol.value).toBe("SPY");
    expect(history.benchmark?.dataPoints).toHaveLength(1);
  });

  it("creates with empty dataPoints", () => {
    const history = PerformanceHistory.create({ dataPoints: [] });
    expect(history.dataPoints).toHaveLength(0);
    expect(history.benchmark).toBeUndefined();
  });
});

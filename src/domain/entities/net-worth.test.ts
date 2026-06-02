import { describe, it, expect } from "vitest";
import { NetWorth } from "./net-worth.js";
import { Money } from "../value-objects/money.js";
import { Currency } from "../value-objects/currency.js";

const usd = Currency.create("USD");
const money = (amount: number) => Money.of(amount, usd);

describe("NetWorth", () => {
  it("creates with required fields only", () => {
    const nw = NetWorth.create({
      totalNetWorth: money(50000),
      investments: money(40000),
      asOf: "2024-12-31",
    });
    expect(nw.totalNetWorth.amount).toBe(50000);
    expect(nw.investments.amount).toBe(40000);
    expect(nw.asOf).toBe("2024-12-31");
  });

  it("creates with otherAssets and liabilities", () => {
    const nw = NetWorth.create({
      totalNetWorth: money(50000),
      investments: money(40000),
      otherAssets: money(20000),
      liabilities: money(10000),
      asOf: "2024-12-31",
    });
    expect(nw.otherAssets?.amount).toBe(20000);
    expect(nw.liabilities?.amount).toBe(10000);
  });

  it("optional fields absent when not provided", () => {
    const nw = NetWorth.create({
      totalNetWorth: money(50000),
      investments: money(40000),
      asOf: "2024-12-31",
    });
    expect(nw.otherAssets).toBeUndefined();
    expect(nw.liabilities).toBeUndefined();
  });

  it("stores asOf date", () => {
    const nw = NetWorth.create({
      totalNetWorth: money(50000),
      investments: money(40000),
      asOf: "2025-01-15",
    });
    expect(nw.asOf).toBe("2025-01-15");
  });
});

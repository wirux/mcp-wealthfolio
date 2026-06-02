import { describe, expect, it } from "vitest";

import { Currency } from "./currency.js";
import { Money } from "./money.js";

describe("Money", () => {
  it("adds decimal values with currency rounding", () => {
    const result = Money.fromRaw(0.1, "USD").add(Money.fromRaw(0.2, "USD"));

    expect(result.amount).toBe(0.3);
  });

  it("multiplies USD amounts with two-decimal rounding", () => {
    const result = Money.fromRaw(10_000, "USD").multiply(0.3333);

    expect(result.amount).toBe(3333);
  });

  it("multiplies JPY amounts with zero-decimal rounding", () => {
    const result = Money.fromRaw(1000, "JPY").multiply(0.3333);

    expect(result.amount).toBe(333);
  });

  it("rejects cross-currency addition", () => {
    const usd = Money.fromRaw(10, "USD");
    const eur = Money.fromRaw(10, "EUR");

    expect(() => usd.add(eur)).toThrow(/Currency mismatch/);
  });

  it("subtracts amounts", () => {
    const result = Money.fromRaw(100, "USD").subtract(Money.fromRaw(40, "USD"));

    expect(result.amount).toBe(60);
  });

  it("calculates percentage using decimal fraction", () => {
    const result = Money.fromRaw(250, "USD").percentage(0.1);

    expect(result.amount).toBe(25);
  });

  it("formats display string using currency minor units", () => {
    expect(Money.fromRaw(123.456, "USD").toDisplayString()).toBe("123.46 USD");
  });

  it("formats zero-decimal display string", () => {
    expect(Money.fromRaw(123.4, "JPY").toDisplayString()).toBe("123 JPY");
  });

  it("creates from Currency instance", () => {
    const result = Money.of(12.345, Currency.create("USD"));

    expect(result.amount).toBe(12.35);
    expect(result.currency.code).toBe("USD");
  });

  it("supports negative subtraction results", () => {
    const result = Money.fromRaw(10, "USD").subtract(Money.fromRaw(12, "USD"));

    expect(result.amount).toBe(-2);
  });

  it("rejects invalid amount", () => {
    expect(() => Money.fromRaw(Number.NaN, "USD")).toThrow(/Invalid amount/);
  });

  it("rejects invalid multiplier", () => {
    expect(() => Money.fromRaw(10, "USD").multiply(Number.POSITIVE_INFINITY)).toThrow(
      /Invalid factor/,
    );
  });
});

import { describe, it, expect } from "vitest";
import { ExchangeRate } from "./exchange-rate.js";
import { Currency } from "../value-objects/currency.js";

const usd = Currency.create("USD");
const eur = Currency.create("EUR");

describe("ExchangeRate", () => {
  it("creates with valid rate", () => {
    const rate = ExchangeRate.create(usd, eur, 0.92, "2024-12-31");
    expect(rate.from.code).toBe("USD");
    expect(rate.to.code).toBe("EUR");
    expect(rate.rate).toBe(0.92);
    expect(rate.date).toBe("2024-12-31");
  });

  it("throws for zero rate", () => {
    expect(() => ExchangeRate.create(usd, eur, 0, "2024-12-31")).toThrow(
      "Exchange rate must be positive"
    );
  });

  it("throws for negative rate", () => {
    expect(() => ExchangeRate.create(usd, eur, -1.5, "2024-12-31")).toThrow(
      "Exchange rate must be positive"
    );
  });
});

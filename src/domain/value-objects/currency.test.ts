import { describe, expect, it } from "vitest";

import { Currency } from "./currency.js";

describe("Currency", () => {
  it("creates USD", () => {
    expect(Currency.create("USD").code).toBe("USD");
  });

  it("creates EUR", () => {
    expect(Currency.create("EUR").code).toBe("EUR");
  });

  it("creates JPY", () => {
    expect(Currency.create("JPY").code).toBe("JPY");
  });

  it("creates BHD", () => {
    expect(Currency.create("BHD").code).toBe("BHD");
  });

  it("rejects an empty string", () => {
    expect(() => Currency.create("")).toThrow(/Invalid currency code/);
  });

  it("rejects lowercase code", () => {
    expect(() => Currency.create("usd")).toThrow(/Invalid currency code/);
  });

  it("rejects two-character code", () => {
    expect(() => Currency.create("US")).toThrow(/Invalid currency code/);
  });

  it("rejects four-character code", () => {
    expect(() => Currency.create("USDD")).toThrow(/Invalid currency code/);
  });

  it("rejects non-string value", () => {
    expect(() => Currency.create(123)).toThrow(/Invalid currency code/);
  });

  it("assigns known minor units", () => {
    expect(Currency.create("USD").minorUnits).toBe(2);
    expect(Currency.create("JPY").minorUnits).toBe(0);
    expect(Currency.create("BHD").minorUnits).toBe(3);
  });

  it("defaults unknown currencies to two minor units", () => {
    expect(Currency.create("XYZ").minorUnits).toBe(2);
  });

  it("compares equal when code matches", () => {
    expect(Currency.create("USD").equals(Currency.create("USD"))).toBe(true);
  });

  it("compares unequal when code differs", () => {
    expect(Currency.create("USD").equals(Currency.create("EUR"))).toBe(false);
  });

  it("returns code from toString", () => {
    expect(Currency.create("CHF").toString()).toBe("CHF");
  });
});

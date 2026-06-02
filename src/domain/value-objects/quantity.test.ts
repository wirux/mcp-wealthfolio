import { describe, expect, it } from "vitest";

import { Quantity } from "./quantity.js";

describe("Quantity", () => {
  it("creates positive holding quantity", () => {
    expect(Quantity.holding(100).value).toBe(100);
  });

  it("creates zero holding quantity", () => {
    expect(Quantity.holding(0).value).toBe(0);
  });

  it("rejects negative holding quantity", () => {
    expect(() => Quantity.holding(-1)).toThrow(/cannot be negative/);
  });

  it("creates positive delta quantity", () => {
    expect(Quantity.delta(100).value).toBe(100);
  });

  it("creates zero delta quantity", () => {
    expect(Quantity.delta(0).value).toBe(0);
  });

  it("creates negative delta quantity", () => {
    expect(Quantity.delta(-50).value).toBe(-50);
  });

  it("returns raw value from toString", () => {
    expect(Quantity.delta(-50).toString()).toBe("-50");
  });
});

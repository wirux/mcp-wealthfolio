import { describe, expect, it } from "vitest";

import { Percentage } from "./percentage.js";

describe("Percentage", () => {
  it("creates zero percent", () => {
    expect(Percentage.create(0).value).toBe(0);
  });

  it("creates one hundred percent", () => {
    expect(Percentage.create(1).value).toBe(1);
  });

  it("creates a fractional percentage", () => {
    expect(Percentage.create(0.333).value).toBe(0.333);
  });

  it("rejects values below zero", () => {
    expect(() => Percentage.create(-0.01)).toThrow(/between 0 and 1/);
  });

  it("rejects values above one", () => {
    expect(() => Percentage.create(1.01)).toThrow(/between 0 and 1/);
  });

  it("creates from basis points", () => {
    expect(Percentage.fromBasisPoints(3333).value).toBeCloseTo(0.3333);
  });

  it("creates from percent", () => {
    expect(Percentage.fromPercent(33.33).value).toBeCloseTo(0.3333);
  });

  it("formats display string", () => {
    expect(Percentage.fromPercent(33.3).toDisplayString()).toBe("33.30%");
  });

  it("rejects invalid basis points", () => {
    expect(() => Percentage.fromBasisPoints(Number.NaN)).toThrow(/Invalid basis points/);
  });

  it("rejects invalid percent input", () => {
    expect(() => Percentage.fromPercent(Number.NEGATIVE_INFINITY)).toThrow(/Invalid percent/);
  });
});

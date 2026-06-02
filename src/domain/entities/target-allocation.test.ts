import { describe, expect, it } from "vitest";
import { InvalidTargetAllocationError } from "../errors/invalid-target-allocation-error.js";
import { TargetAllocation } from "./target-allocation.js";

describe("TargetAllocation", () => {
  it("creates allocation for valid two-symbol weights summing to 1.0", () => {
    const allocation = TargetAllocation.create({ AAPL: 0.6, BND: 0.4 });

    expect(allocation.targets.size).toBe(2);
  });

  it("accepts three-symbol weights summing to 0.999 at tolerance boundary", () => {
    expect(() => TargetAllocation.create({ AAPL: 0.333, VXUS: 0.333, BND: 0.333 }))
      .not.toThrow();
  });

  it("rejects three-symbol weights summing to 0.998 outside tolerance", () => {
    expect(() => TargetAllocation.create({ AAPL: 0.333, VXUS: 0.333, BND: 0.332 }))
      .toThrow(InvalidTargetAllocationError);
  });

  it("accepts three-symbol weights summing to 1.001 at tolerance boundary", () => {
    expect(() => TargetAllocation.create({ AAPL: 0.334, VXUS: 0.333, BND: 0.334 }))
      .not.toThrow();
  });

  it("rejects three-symbol weights summing to 1.002 outside tolerance", () => {
    expect(() => TargetAllocation.create({ AAPL: 0.334, VXUS: 0.334, BND: 0.334 }))
      .toThrow(InvalidTargetAllocationError);
  });

  it("rejects empty weights", () => {
    expect(() => TargetAllocation.create({})).toThrow(InvalidTargetAllocationError);
  });

  it("stores one target per symbol", () => {
    const allocation = TargetAllocation.create({ AAPL: 0.5, VXUS: 0.3, BND: 0.2 });

    expect(allocation.targets.size).toBe(3);
  });

  it("stores percentages keyed by symbol", () => {
    const allocation = TargetAllocation.create({ AAPL: 0.7, BND: 0.3 });

    expect(allocation.targets.get("AAPL")?.value).toBe(0.7);
    expect(allocation.targets.get("BND")?.value).toBe(0.3);
  });
});

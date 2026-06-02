import { describe, it, expect } from "vitest";
import { Allocation } from "./allocation.js";
import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";
import { Currency } from "../value-objects/currency.js";

const usd = Currency.create("USD");
const money = (amount: number) => Money.of(amount, usd);
const pct = (value: number) => Percentage.create(value);

describe("Allocation", () => {
  it("creates empty allocation", () => {
    const allocation = Allocation.create([]);
    expect(allocation.items).toHaveLength(0);
  });

  it("creates allocation with one item", () => {
    const item = { label: "Stocks", value: money(1000), weight: pct(0.6) };
    const allocation = Allocation.create([item]);
    expect(allocation.items).toHaveLength(1);
    expect(allocation.items[0]!.label).toBe("Stocks");
    expect(allocation.items[0]!.value.amount).toBe(1000);
    expect(allocation.items[0]!.weight.value).toBe(0.6);
  });

  it("creates allocation with nested children", () => {
    const child1 = { label: "US Stocks", value: money(600), weight: pct(0.36) };
    const child2 = { label: "EU Stocks", value: money(400), weight: pct(0.24) };
    const parent = { label: "Stocks", value: money(1000), weight: pct(0.6), children: [child1, child2] };
    const allocation = Allocation.create([parent]);
    expect(allocation.items[0]!.children).toHaveLength(2);
    expect(allocation.items[0]!.children![0]!.label).toBe("US Stocks");
  });

  it("items are readonly array", () => {
    const allocation = Allocation.create([{ label: "Bonds", value: money(500), weight: pct(0.4) }]);
    expect(Array.isArray(allocation.items)).toBe(true);
  });
});

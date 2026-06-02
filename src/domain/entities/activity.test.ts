import { describe, it, expect } from "vitest";
import { Activity } from "./activity.js";
import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Money } from "../value-objects/money.js";
import { Quantity } from "../value-objects/quantity.js";
import { Currency } from "../value-objects/currency.js";
import { ValidationError } from "../errors/validation-error.js";

const usd = Currency.create("USD");
const total = Money.of(1000, usd);

const baseProps = {
  id: "act-1",
  accountId: "acc-1",
  activityType: "BUY" as const,
  totalAmount: total,
  date: "2024-01-15",
};

describe("Activity", () => {
  it("creates a valid activity", () => {
    const a = Activity.create(baseProps);
    expect(a.id).toBe("act-1");
    expect(a.accountId).toBe("acc-1");
    expect(a.activityType).toBe("BUY");
    expect(a.totalAmount).toBe(total);
    expect(a.date).toBe("2024-01-15");
    expect(a.symbol).toBeUndefined();
    expect(a.quantity).toBeUndefined();
    expect(a.unitPrice).toBeUndefined();
    expect(a.description).toBeUndefined();
  });

  it("creates activity with optional fields", () => {
    const symbol = AssetSymbol.create("AAPL");
    const qty = Quantity.delta(5);
    const unitPrice = Money.of(200, usd);
    const a = Activity.create({
      ...baseProps,
      symbol,
      quantity: qty,
      unitPrice,
      description: "Buy AAPL",
    });
    expect(a.symbol).toBe(symbol);
    expect(a.quantity).toBe(qty);
    expect(a.unitPrice).toBe(unitPrice);
    expect(a.description).toBe("Buy AAPL");
  });

  it("throws ValidationError for empty id", () => {
    expect(() => Activity.create({ ...baseProps, id: "" })).toThrow(ValidationError);
  });

  it("throws ValidationError for empty accountId", () => {
    expect(() => Activity.create({ ...baseProps, accountId: "  " })).toThrow(ValidationError);
  });

  it("throws ValidationError for empty date", () => {
    expect(() => Activity.create({ ...baseProps, date: "  " })).toThrow(ValidationError);
  });

  it("ValidationError field is 'id'", () => {
    try {
      Activity.create({ ...baseProps, id: "  " });
    } catch (e) {
      expect((e as ValidationError).field).toBe("id");
    }
  });

  it("ValidationError field is 'accountId'", () => {
    try {
      Activity.create({ ...baseProps, accountId: "" });
    } catch (e) {
      expect((e as ValidationError).field).toBe("accountId");
    }
  });

  it("ValidationError field is 'date'", () => {
    try {
      Activity.create({ ...baseProps, date: "" });
    } catch (e) {
      expect((e as ValidationError).field).toBe("date");
    }
  });

  it("supports all activity types", () => {
    const types = ["BUY", "SELL", "DIVIDEND", "INTEREST", "DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT", "FEE", "TAX"] as const;
    for (const activityType of types) {
      const a = Activity.create({ ...baseProps, activityType });
      expect(a.activityType).toBe(activityType);
    }
  });
});

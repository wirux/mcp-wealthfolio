import { describe, it, expect } from "vitest";
import { Holding } from "./holding.js";
import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";
import { Quantity } from "../value-objects/quantity.js";
import { Currency } from "../value-objects/currency.js";
import { ValidationError } from "../errors/validation-error.js";

const usd = Currency.create("USD");
const symbol = AssetSymbol.create("AAPL");
const qty = Quantity.holding(10);
const mv = Money.of(1500, usd);
const cb = Money.of(1200, usd);
const ugl = Money.of(300, usd);
const uglPct = Percentage.create(0.25);
const weight = Percentage.create(0.1);

const baseProps = {
  id: "h-1",
  accountId: "acc-1",
  symbol,
  quantity: qty,
  marketValue: mv,
  costBasis: cb,
  unrealizedGainLoss: ugl,
  unrealizedGainLossPercent: uglPct,
  weight,
};

describe("Holding", () => {
  it("creates a valid holding", () => {
    const h = Holding.create(baseProps);
    expect(h.id).toBe("h-1");
    expect(h.accountId).toBe("acc-1");
    expect(h.symbol).toBe(symbol);
    expect(h.quantity).toBe(qty);
    expect(h.marketValue).toBe(mv);
    expect(h.assetType).toBeUndefined();
  });

  it("creates holding with optional assetType", () => {
    const h = Holding.create({ ...baseProps, assetType: "EQUITY" });
    expect(h.assetType).toBe("EQUITY");
  });

  it("throws ValidationError for empty id", () => {
    expect(() => Holding.create({ ...baseProps, id: "" })).toThrow(ValidationError);
  });

  it("throws ValidationError for empty accountId", () => {
    expect(() => Holding.create({ ...baseProps, accountId: "  " })).toThrow(ValidationError);
  });

  it("ValidationError field is 'id' for empty id", () => {
    try {
      Holding.create({ ...baseProps, id: "  " });
    } catch (e) {
      expect((e as ValidationError).field).toBe("id");
    }
  });

  it("ValidationError field is 'accountId' for empty accountId", () => {
    try {
      Holding.create({ ...baseProps, accountId: "" });
    } catch (e) {
      expect((e as ValidationError).field).toBe("accountId");
    }
  });
});

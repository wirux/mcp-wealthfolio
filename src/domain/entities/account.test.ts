import { describe, it, expect } from "vitest";
import { Account } from "./account.js";
import { Currency } from "../value-objects/currency.js";
import { ValidationError } from "../errors/validation-error.js";

const usd = Currency.create("USD");

describe("Account", () => {
  it("creates a valid account", () => {
    const account = Account.create({ id: "acc-1", name: "Brokerage", currency: usd, isActive: true });
    expect(account.id).toBe("acc-1");
    expect(account.name).toBe("Brokerage");
    expect(account.currency).toBe(usd);
    expect(account.isActive).toBe(true);
    expect(account.group).toBeUndefined();
  });

  it("creates account with optional group", () => {
    const account = Account.create({ id: "acc-2", name: "IRA", currency: usd, isActive: false, group: "Retirement" });
    expect(account.group).toBe("Retirement");
    expect(account.isActive).toBe(false);
  });

  it("throws ValidationError for empty id", () => {
    expect(() => Account.create({ id: "  ", name: "Test", currency: usd, isActive: true }))
      .toThrow(ValidationError);
  });

  it("throws ValidationError for empty name", () => {
    expect(() => Account.create({ id: "acc-1", name: "", currency: usd, isActive: true }))
      .toThrow(ValidationError);
  });

  it("ValidationError has correct field for id", () => {
    try {
      Account.create({ id: "", name: "Test", currency: usd, isActive: true });
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).field).toBe("id");
    }
  });

  it("ValidationError has correct field for name", () => {
    try {
      Account.create({ id: "acc-1", name: "   ", currency: usd, isActive: true });
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).field).toBe("name");
    }
  });
});

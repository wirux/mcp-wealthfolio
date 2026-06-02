import { Currency } from "./currency.js";

export class Money {
  readonly amount: number;
  readonly currency: Currency;

  private constructor(amount: number, currency: Currency) {
    assertFiniteNumber(amount, "amount");

    this.amount = round(amount, currency.minorUnits);
    this.currency = currency;
  }

  static of(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }

  static fromRaw(amount: number, currencyCode: string): Money {
    return new Money(amount, Currency.create(currencyCode));
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    assertFiniteNumber(factor, "factor");
    return new Money(this.amount * factor, this.currency);
  }

  percentage(pct: number): Money {
    assertFiniteNumber(pct, "percentage");
    return new Money(this.amount * pct, this.currency);
  }

  toDisplayString(): string {
    return `${this.amount.toFixed(this.currency.minorUnits)} ${this.currency.code}`;
  }

  private assertSameCurrency(other: Money): void {
    if (!this.currency.equals(other.currency)) {
      throw new Error(
        `Currency mismatch: ${this.currency.code} vs ${other.currency.code}`,
      );
    }
  }
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${label}: ${String(value)}`);
  }
}

import { Currency } from "../value-objects/currency.js";

export class ExchangeRate {
  readonly from: Currency;
  readonly to: Currency;
  readonly rate: number;
  readonly date: string; // ISO 8601

  private constructor(from: Currency, to: Currency, rate: number, date: string) {
    this.from = from;
    this.to = to;
    this.rate = rate;
    this.date = date;
  }

  static create(from: Currency, to: Currency, rate: number, date: string): ExchangeRate {
    if (rate <= 0) throw new Error("Exchange rate must be positive");
    return new ExchangeRate(from, to, rate, date);
  }
}

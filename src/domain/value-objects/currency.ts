const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export class Currency {
  private static readonly MINOR_UNITS: Record<string, number> = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    JPY: 0,
    CHF: 2,
    PLN: 2,
    BHD: 3,
    CAD: 2,
    AUD: 2,
    NZD: 2,
    SEK: 2,
    NOK: 2,
    DKK: 2,
    HKD: 2,
    SGD: 2,
    CNY: 2,
    INR: 2,
    KRW: 0,
    MXN: 2,
    BRL: 2,
  };

  readonly code: string;
  readonly minorUnits: number;

  private constructor(code: string) {
    this.code = code;
    this.minorUnits = Currency.MINOR_UNITS[code] ?? 2;
  }

  static create(code: unknown): Currency {
    if (typeof code !== "string" || !CURRENCY_CODE_PATTERN.test(code)) {
      throw new Error(`Invalid currency code: ${String(code)}`);
    }

    return new Currency(code);
  }

  equals(other: Currency): boolean {
    return this.code === other.code;
  }

  toString(): string {
    return this.code;
  }
}

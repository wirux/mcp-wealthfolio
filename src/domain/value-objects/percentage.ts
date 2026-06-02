export class Percentage {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Percentage {
    assertFiniteNumber(value, "percentage");

    if (value < 0 || value > 1) {
      throw new Error(`Percentage must be between 0 and 1: ${value}`);
    }

    return new Percentage(value);
  }

  static fromBasisPoints(bp: number): Percentage {
    assertFiniteNumber(bp, "basis points");
    return Percentage.create(bp / 10_000);
  }

  static fromPercent(pct: number): Percentage {
    assertFiniteNumber(pct, "percent");
    return Percentage.create(pct / 100);
  }

  toDisplayString(): string {
    return `${(this.value * 100).toFixed(2)}%`;
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${label}: ${String(value)}`);
  }
}

export class Quantity {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static holding(value: number): Quantity {
    assertFiniteNumber(value, "quantity");

    if (value < 0) {
      throw new Error(`Holding quantity cannot be negative: ${value}`);
    }

    return new Quantity(value);
  }

  static delta(value: number): Quantity {
    assertFiniteNumber(value, "quantity delta");
    return new Quantity(value);
  }

  toString(): string {
    return String(this.value);
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${label}: ${String(value)}`);
  }
}

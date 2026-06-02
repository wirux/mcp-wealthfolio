export class AssetSymbol {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: unknown): AssetSymbol {
    if (typeof raw !== "string") {
      throw new Error(`Invalid asset symbol: ${String(raw)}`);
    }

    const normalized = raw.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new Error("Asset symbol cannot be empty");
    }

    return new AssetSymbol(normalized);
  }

  toString(): string {
    return this.value;
  }
}

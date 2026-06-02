import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";

export interface DriftProps {
  symbol: AssetSymbol;
  currentWeight: Percentage;
  targetWeight: Percentage;
  deltaValue: Money;
}

interface DriftState extends DriftProps {
  driftPercent: number;
}

export class Drift {
  readonly symbol: AssetSymbol;
  readonly currentWeight: Percentage;
  readonly targetWeight: Percentage;
  readonly driftPercent: number;
  readonly deltaValue: Money;
  readonly action: "buy" | "sell" | "hold";

  private constructor(props: DriftState) {
    this.symbol = props.symbol;
    this.currentWeight = props.currentWeight;
    this.targetWeight = props.targetWeight;
    this.driftPercent = props.driftPercent;
    this.deltaValue = props.deltaValue;
    this.action = props.deltaValue.amount > 0
      ? "buy"
      : props.deltaValue.amount < 0
        ? "sell"
        : "hold";
  }

  static create(props: DriftProps): Drift {
    const driftPercent = props.targetWeight.value - props.currentWeight.value;
    return new Drift({ ...props, driftPercent });
  }

  get absoluteDrift(): number {
    return Math.abs(this.driftPercent);
  }
}

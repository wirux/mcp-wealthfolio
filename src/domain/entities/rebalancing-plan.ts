import { Money } from "../value-objects/money.js";
import { Drift } from "./drift.js";
import { TargetAllocation } from "./target-allocation.js";

export interface RebalancingPlanProps {
  drifts: Drift[];
  totalValue: Money;
  cashToInvest?: Money;
  targetAllocation: TargetAllocation;
}

export class RebalancingPlan {
  readonly drifts: readonly Drift[];
  readonly totalValue: Money;
  readonly cashToInvest?: Money;
  readonly targetAllocation: TargetAllocation;

  private constructor(props: RebalancingPlanProps) {
    this.drifts = [...props.drifts].sort((a, b) => {
      const diff = b.absoluteDrift - a.absoluteDrift;

      if (Math.abs(diff) > Number.EPSILON) {
        return diff;
      }

      return a.symbol.value.localeCompare(b.symbol.value);
    });
    this.totalValue = props.totalValue;
    if (props.cashToInvest !== undefined) this.cashToInvest = props.cashToInvest;
    this.targetAllocation = props.targetAllocation;
  }

  static create(props: RebalancingPlanProps): RebalancingPlan {
    return new RebalancingPlan(props);
  }
}

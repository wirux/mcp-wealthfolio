import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";

export interface PerformancePeriod {
  readonly from: string; // ISO 8601
  readonly to: string; // ISO 8601
}

export interface PerformanceSummaryProps {
  totalValue: Money;
  totalGainLoss: Money;
  totalGainLossPercent: Percentage;
  twr?: Percentage; // time-weighted return
  mwr?: Percentage; // money-weighted return
  period?: PerformancePeriod;
}

export class PerformanceSummary {
  readonly totalValue: Money;
  readonly totalGainLoss: Money;
  readonly totalGainLossPercent: Percentage;
  readonly twr?: Percentage;
  readonly mwr?: Percentage;
  readonly period?: PerformancePeriod;

  private constructor(props: PerformanceSummaryProps) {
    this.totalValue = props.totalValue;
    this.totalGainLoss = props.totalGainLoss;
    this.totalGainLossPercent = props.totalGainLossPercent;
    if (props.twr !== undefined) this.twr = props.twr;
    if (props.mwr !== undefined) this.mwr = props.mwr;
    if (props.period !== undefined) this.period = props.period;
  }

  static create(props: PerformanceSummaryProps): PerformanceSummary {
    return new PerformanceSummary(props);
  }
}

import { Money } from "../value-objects/money.js";
import { AssetSymbol } from "../value-objects/asset-symbol.js";

export interface PerformanceDataPoint {
  readonly date: string; // ISO 8601
  readonly value: Money;
}

export interface BenchmarkHistory {
  readonly symbol: AssetSymbol;
  readonly dataPoints: ReadonlyArray<PerformanceDataPoint>;
}

export interface PerformanceHistoryProps {
  dataPoints: PerformanceDataPoint[];
  benchmark?: BenchmarkHistory;
}

export class PerformanceHistory {
  readonly dataPoints: ReadonlyArray<PerformanceDataPoint>;
  readonly benchmark?: BenchmarkHistory;

  private constructor(props: PerformanceHistoryProps) {
    this.dataPoints = props.dataPoints;
    if (props.benchmark !== undefined) this.benchmark = props.benchmark;
  }

  static create(props: PerformanceHistoryProps): PerformanceHistory {
    return new PerformanceHistory(props);
  }
}

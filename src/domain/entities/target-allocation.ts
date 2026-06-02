import { InvalidTargetAllocationError } from "../errors/invalid-target-allocation-error.js";
import { Percentage } from "../value-objects/percentage.js";

export class TargetAllocation {
  readonly targets: ReadonlyMap<string, Percentage>;

  private constructor(targets: Map<string, Percentage>) {
    this.targets = targets;
  }

  static create(weights: Record<string, number>): TargetAllocation {
    const entries = Object.entries(weights);

    if (entries.length === 0) {
      throw new InvalidTargetAllocationError(weights, 0);
    }

    const sum = entries.reduce((acc, [, weight]) => acc + weight, 0);

    if (Math.abs(sum - 1.0) > 0.001 + Number.EPSILON) {
      throw new InvalidTargetAllocationError(weights, sum);
    }

    const targets = new Map(
      entries.map(([symbol, weight]) => [symbol, Percentage.create(weight)]),
    );

    return new TargetAllocation(targets);
  }
}

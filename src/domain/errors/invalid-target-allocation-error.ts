import { DomainError } from "./domain-error.js";

export class InvalidTargetAllocationError extends DomainError {
  readonly code = "INVALID_TARGET_ALLOCATION" as const;
  readonly weights: Record<string, number>;
  readonly sum: number;

  constructor(weights: Record<string, number>, sum: number) {
    super(
      `Target weights sum to ${sum.toFixed(4)}, must be 1.0 \u00b1 0.001`,
      { weights, sum },
    );
    this.weights = weights;
    this.sum = sum;
  }
}

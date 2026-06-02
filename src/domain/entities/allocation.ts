import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";

export interface AllocationItem {
  readonly label: string;
  readonly value: Money;
  readonly weight: Percentage;
  readonly children?: AllocationItem[];
}

export class Allocation {
  readonly items: ReadonlyArray<AllocationItem>;

  private constructor(items: ReadonlyArray<AllocationItem>) {
    this.items = items;
  }

  static create(items: AllocationItem[]): Allocation {
    return new Allocation(items);
  }
}

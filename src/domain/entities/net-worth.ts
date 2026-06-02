import { Money } from "../value-objects/money.js";

export interface NetWorthProps {
  totalNetWorth: Money;
  investments: Money;
  otherAssets?: Money;
  liabilities?: Money;
  asOf: string; // ISO 8601
}

export class NetWorth {
  readonly totalNetWorth: Money;
  readonly investments: Money;
  readonly otherAssets?: Money;
  readonly liabilities?: Money;
  readonly asOf: string;

  private constructor(props: NetWorthProps) {
    this.totalNetWorth = props.totalNetWorth;
    this.investments = props.investments;
    if (props.otherAssets !== undefined) this.otherAssets = props.otherAssets;
    if (props.liabilities !== undefined) this.liabilities = props.liabilities;
    this.asOf = props.asOf;
  }

  static create(props: NetWorthProps): NetWorth {
    return new NetWorth(props);
  }
}

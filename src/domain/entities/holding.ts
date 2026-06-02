import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Money } from "../value-objects/money.js";
import { Percentage } from "../value-objects/percentage.js";
import { Quantity } from "../value-objects/quantity.js";
import { ValidationError } from "../errors/validation-error.js";

export interface HoldingProps {
  id: string;
  accountId: string;
  symbol: AssetSymbol;
  quantity: Quantity;
  marketValue: Money;
  costBasis: Money;
  unrealizedGainLoss: Money;
  unrealizedGainLossPercent: Percentage;
  weight: Percentage;
  assetType?: string;
}

export class Holding {
  readonly id: string;
  readonly accountId: string;
  readonly symbol: AssetSymbol;
  readonly quantity: Quantity;
  readonly marketValue: Money;
  readonly costBasis: Money;
  readonly unrealizedGainLoss: Money;
  readonly unrealizedGainLossPercent: Percentage;
  readonly weight: Percentage;
  readonly assetType?: string;

  private constructor(props: HoldingProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.symbol = props.symbol;
    this.quantity = props.quantity;
    this.marketValue = props.marketValue;
    this.costBasis = props.costBasis;
    this.unrealizedGainLoss = props.unrealizedGainLoss;
    this.unrealizedGainLossPercent = props.unrealizedGainLossPercent;
    this.weight = props.weight;
    if (props.assetType !== undefined) this.assetType = props.assetType;
  }

  static create(props: HoldingProps): Holding {
    if (!props.id.trim()) throw new ValidationError("Holding id is required", "id");
    if (!props.accountId.trim()) throw new ValidationError("Holding accountId is required", "accountId");
    return new Holding(props);
  }
}

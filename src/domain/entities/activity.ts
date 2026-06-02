import { AssetSymbol } from "../value-objects/asset-symbol.js";
import { Money } from "../value-objects/money.js";
import { Quantity } from "../value-objects/quantity.js";
import { ValidationError } from "../errors/validation-error.js";
import { ActivityType } from "./activity-type.js";

export interface ActivityProps {
  id: string;
  accountId: string;
  activityType: ActivityType;
  symbol?: AssetSymbol;
  quantity?: Quantity;
  unitPrice?: Money;
  fee?: Money;
  totalAmount: Money;
  date: string;
  description?: string;
}

export class Activity {
  readonly id: string;
  readonly accountId: string;
  readonly activityType: ActivityType;
  readonly symbol?: AssetSymbol;
  readonly quantity?: Quantity;
  readonly unitPrice?: Money;
  readonly fee?: Money;
  readonly totalAmount: Money;
  readonly date: string;
  readonly description?: string;

  private constructor(props: ActivityProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.activityType = props.activityType;
    if (props.symbol !== undefined) this.symbol = props.symbol;
    if (props.quantity !== undefined) this.quantity = props.quantity;
    if (props.unitPrice !== undefined) this.unitPrice = props.unitPrice;
    if (props.fee !== undefined) this.fee = props.fee;
    this.totalAmount = props.totalAmount;
    this.date = props.date;
    if (props.description !== undefined) this.description = props.description;
  }

  static create(props: ActivityProps): Activity {
    if (!props.id.trim()) throw new ValidationError("Activity id is required", "id");
    if (!props.accountId.trim()) throw new ValidationError("Activity accountId is required", "accountId");
    if (!props.date.trim()) throw new ValidationError("Activity date is required", "date");
    return new Activity(props);
  }
}

import { Currency } from "../value-objects/currency.js";
import { ValidationError } from "../errors/validation-error.js";

export interface AccountProps {
  id: string;
  name: string;
  currency: Currency;
  isActive: boolean;
  group?: string;
}

export class Account {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
  readonly isActive: boolean;
  readonly group?: string;

  private constructor(props: AccountProps) {
    this.id = props.id;
    this.name = props.name;
    this.currency = props.currency;
    this.isActive = props.isActive;
    if (props.group !== undefined) this.group = props.group;
  }

  static create(props: AccountProps): Account {
    if (!props.id.trim()) throw new ValidationError("Account id is required", "id");
    if (!props.name.trim()) throw new ValidationError("Account name is required", "name");
    return new Account(props);
  }
}

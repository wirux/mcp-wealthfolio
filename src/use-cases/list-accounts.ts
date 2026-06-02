import type { WealthfolioReadGateway } from "../domain/ports/wealthfolio-gateway.js";
import type { Account } from "../domain/entities/account.js";

export class ListAccountsUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(): Promise<Account[]> {
    return this.gateway.listAccounts();
  }
}

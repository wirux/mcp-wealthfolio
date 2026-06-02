import type { WealthfolioReadGateway } from "../domain/ports/wealthfolio-gateway.js";
import type { Holding } from "../domain/entities/holding.js";

export class GetHoldingsUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(accountId?: string): Promise<Holding[]> {
    return this.gateway.getHoldings(accountId);
  }
}

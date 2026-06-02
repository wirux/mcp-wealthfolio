import type { WealthfolioReadGateway } from "../domain/ports/wealthfolio-gateway.js";
import type { Holding } from "../domain/entities/holding.js";

export class GetHoldingDetailUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(accountId: string, assetId: string): Promise<Holding> {
    return this.gateway.getHoldingDetail(accountId, assetId);
  }
}

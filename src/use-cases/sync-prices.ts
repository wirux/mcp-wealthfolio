import type { WealthfolioWriteGateway } from "../domain/ports/wealthfolio-gateway.js";

export class SyncPricesUseCase {
  constructor(private readonly gateway: WealthfolioWriteGateway) {}

  async execute(): Promise<void> {
    await this.gateway.syncPrices();
  }
}

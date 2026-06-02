import type { WealthfolioReadGateway, HealthStatus } from "../domain/ports/wealthfolio-gateway.js";

export class GetHealthUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(): Promise<HealthStatus> {
    try {
      return await this.gateway.checkHealth();
    } catch {
      return { healthy: false };
    }
  }
}

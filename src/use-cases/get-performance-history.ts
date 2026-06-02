import type { WealthfolioReadGateway, PerformanceHistoryParams } from "../domain/ports/wealthfolio-gateway.js";
import type { PerformanceHistory } from "../domain/entities/performance-history.js";

export class GetPerformanceHistoryUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(params: PerformanceHistoryParams): Promise<PerformanceHistory> {
    return this.gateway.getPerformanceHistory(params);
  }
}

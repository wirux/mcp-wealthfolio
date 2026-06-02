import type { WealthfolioReadGateway } from "../domain/ports/wealthfolio-gateway.js";
import type { PerformanceSummary } from "../domain/entities/performance-summary.js";

export class GetPerformanceSummaryUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(from?: string, to?: string): Promise<PerformanceSummary> {
    return this.gateway.getPerformanceSummary(from, to);
  }
}

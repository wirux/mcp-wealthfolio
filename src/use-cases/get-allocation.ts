import type { WealthfolioReadGateway } from "../domain/ports/wealthfolio-gateway.js";
import type { Allocation } from "../domain/entities/allocation.js";

export class GetAllocationUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(accountId?: string): Promise<Allocation> {
    return this.gateway.getAllocations(accountId);
  }
}

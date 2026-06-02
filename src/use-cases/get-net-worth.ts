import type { WealthfolioReadGateway } from "../domain/ports/wealthfolio-gateway.js";
import type { NetWorth } from "../domain/entities/net-worth.js";

export class GetNetWorthUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(): Promise<NetWorth> {
    return this.gateway.getNetWorth();
  }
}

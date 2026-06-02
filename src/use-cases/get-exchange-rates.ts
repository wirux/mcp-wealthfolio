import type { WealthfolioReadGateway } from "../domain/ports/wealthfolio-gateway.js";
import type { ExchangeRate } from "../domain/entities/exchange-rate.js";

export class GetExchangeRatesUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(): Promise<ExchangeRate[]> {
    return this.gateway.getExchangeRates();
  }
}

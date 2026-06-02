import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetExchangeRatesUseCase } from "./get-exchange-rates.js";

const mockGateway: WealthfolioGateway = {
  listAccounts: vi.fn(),
  getHoldings: vi.fn(),
  getHoldingDetail: vi.fn(),
  getAllocations: vi.fn(),
  getPerformanceSummary: vi.fn(),
  getPerformanceHistory: vi.fn(),
  searchActivities: vi.fn(),
  getNetWorth: vi.fn(),
  getExchangeRates: vi.fn(),
  syncPrices: vi.fn(),
  checkHealth: vi.fn(),
};

describe("GetExchangeRatesUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns exchange rates from gateway", async () => {
    const rates = [{ from: "USD", to: "EUR", rate: 0.85 }] as never;
    vi.mocked(mockGateway.getExchangeRates).mockResolvedValue(rates);

    const useCase = new GetExchangeRatesUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(rates);
    expect(mockGateway.getExchangeRates).toHaveBeenCalledOnce();
  });

  it("propagates errors from gateway", async () => {
    vi.mocked(mockGateway.getExchangeRates).mockRejectedValue(new Error("Unavailable"));

    const useCase = new GetExchangeRatesUseCase(mockGateway);
    await expect(useCase.execute()).rejects.toThrow("Unavailable");
  });

  it("returns empty array when gateway returns no rates", async () => {
    const rates = [] as never;
    vi.mocked(mockGateway.getExchangeRates).mockResolvedValue(rates);

    const useCase = new GetExchangeRatesUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(rates);
  });
});

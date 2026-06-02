import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetHealthUseCase } from "./get-health.js";

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

describe("GetHealthUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns health status when Wealthfolio is reachable", async () => {
    const status = { healthy: true, version: "1.2.3" };
    vi.mocked(mockGateway.checkHealth).mockResolvedValue(status);

    const useCase = new GetHealthUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(status);
    expect(mockGateway.checkHealth).toHaveBeenCalledOnce();
  });

  it("returns { healthy: false } when Wealthfolio is unreachable", async () => {
    vi.mocked(mockGateway.checkHealth).mockRejectedValue(new Error("Connection refused"));

    const useCase = new GetHealthUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toEqual({ healthy: false });
  });

  it("does not throw when gateway throws", async () => {
    vi.mocked(mockGateway.checkHealth).mockRejectedValue(new Error("Timeout"));

    const useCase = new GetHealthUseCase(mockGateway);
    await expect(useCase.execute()).resolves.toEqual({ healthy: false });
  });
});

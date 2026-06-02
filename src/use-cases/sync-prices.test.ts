import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { SyncPricesUseCase } from "./sync-prices.js";

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

describe("SyncPricesUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to gateway syncPrices", async () => {
    vi.mocked(mockGateway.syncPrices).mockResolvedValue(undefined);

    const useCase = new SyncPricesUseCase(mockGateway);
    await useCase.execute();

    expect(mockGateway.syncPrices).toHaveBeenCalledOnce();
  });

  it("propagates errors from gateway", async () => {
    vi.mocked(mockGateway.syncPrices).mockRejectedValue(new Error("Sync failed"));

    const useCase = new SyncPricesUseCase(mockGateway);
    await expect(useCase.execute()).rejects.toThrow("Sync failed");
  });
});

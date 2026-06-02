import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetNetWorthUseCase } from "./get-net-worth.js";

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

describe("GetNetWorthUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns net worth from gateway", async () => {
    const netWorth = { total: 100000 } as never;
    vi.mocked(mockGateway.getNetWorth).mockResolvedValue(netWorth);

    const useCase = new GetNetWorthUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(netWorth);
    expect(mockGateway.getNetWorth).toHaveBeenCalledOnce();
  });

  it("propagates errors from gateway", async () => {
    vi.mocked(mockGateway.getNetWorth).mockRejectedValue(new Error("Unavailable"));

    const useCase = new GetNetWorthUseCase(mockGateway);
    await expect(useCase.execute()).rejects.toThrow("Unavailable");
  });

  it("returns zero net worth when gateway returns empty data", async () => {
    const netWorth = { total: 0 } as never;
    vi.mocked(mockGateway.getNetWorth).mockResolvedValue(netWorth);

    const useCase = new GetNetWorthUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(netWorth);
  });
});

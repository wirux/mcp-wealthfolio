import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetPerformanceHistoryUseCase } from "./get-performance-history.js";

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

describe("GetPerformanceHistoryUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns performance history with empty params", async () => {
    const history = { entries: [] } as never;
    vi.mocked(mockGateway.getPerformanceHistory).mockResolvedValue(history);

    const useCase = new GetPerformanceHistoryUseCase(mockGateway);
    const result = await useCase.execute({});

    expect(result).toBe(history);
    expect(mockGateway.getPerformanceHistory).toHaveBeenCalledWith({});
  });

  it("passes all params to gateway", async () => {
    const history = { entries: [{ date: "2024-01-01" }] } as never;
    vi.mocked(mockGateway.getPerformanceHistory).mockResolvedValue(history);

    const params = { itemType: "account", itemId: "acc1", startDate: "2024-01-01", endDate: "2024-12-31" };
    const useCase = new GetPerformanceHistoryUseCase(mockGateway);
    const result = await useCase.execute(params);

    expect(result).toBe(history);
    expect(mockGateway.getPerformanceHistory).toHaveBeenCalledWith(params);
  });

  it("propagates empty results from gateway", async () => {
    const history = { entries: [] } as never;
    vi.mocked(mockGateway.getPerformanceHistory).mockResolvedValue(history);

    const useCase = new GetPerformanceHistoryUseCase(mockGateway);
    const result = await useCase.execute({ startDate: "2024-01-01" });

    expect(result).toBe(history);
  });

  it("propagates errors from gateway", async () => {
    vi.mocked(mockGateway.getPerformanceHistory).mockRejectedValue(new Error("Timeout"));

    const useCase = new GetPerformanceHistoryUseCase(mockGateway);
    await expect(useCase.execute({})).rejects.toThrow("Timeout");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetPerformanceSummaryUseCase } from "./get-performance-summary.js";

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

describe("GetPerformanceSummaryUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns performance summary without date range", async () => {
    const summary = { totalReturn: 0.1 } as never;
    vi.mocked(mockGateway.getPerformanceSummary).mockResolvedValue(summary);

    const useCase = new GetPerformanceSummaryUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(summary);
    expect(mockGateway.getPerformanceSummary).toHaveBeenCalledWith(undefined, undefined);
  });

  it("passes from and to dates to gateway", async () => {
    const summary = { totalReturn: 0.2 } as never;
    vi.mocked(mockGateway.getPerformanceSummary).mockResolvedValue(summary);

    const useCase = new GetPerformanceSummaryUseCase(mockGateway);
    const result = await useCase.execute("2024-01-01", "2024-12-31");

    expect(result).toBe(summary);
    expect(mockGateway.getPerformanceSummary).toHaveBeenCalledWith("2024-01-01", "2024-12-31");
  });

  it("passes only from date when to is omitted", async () => {
    const summary = { totalReturn: 0.05 } as never;
    vi.mocked(mockGateway.getPerformanceSummary).mockResolvedValue(summary);

    const useCase = new GetPerformanceSummaryUseCase(mockGateway);
    const result = await useCase.execute("2024-01-01");

    expect(result).toBe(summary);
    expect(mockGateway.getPerformanceSummary).toHaveBeenCalledWith("2024-01-01", undefined);
  });

  it("propagates errors from gateway", async () => {
    vi.mocked(mockGateway.getPerformanceSummary).mockRejectedValue(new Error("Network error"));

    const useCase = new GetPerformanceSummaryUseCase(mockGateway);
    await expect(useCase.execute()).rejects.toThrow("Network error");
  });
});

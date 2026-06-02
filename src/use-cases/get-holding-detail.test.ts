import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetHoldingDetailUseCase } from "./get-holding-detail.js";
import { ConnectionError } from "../domain/errors/connection-error.js";
import { ApiError } from "../domain/errors/api-error.js";

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

describe("GetHoldingDetailUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns holding detail for given accountId and assetId", async () => {
    const holding = { id: "h1", accountId: "acc1" } as never;
    vi.mocked(mockGateway.getHoldingDetail).mockResolvedValue(holding);

    const useCase = new GetHoldingDetailUseCase(mockGateway);
    const result = await useCase.execute("acc1", "AAPL");

    expect(result).toBe(holding);
    expect(mockGateway.getHoldingDetail).toHaveBeenCalledWith("acc1", "AAPL");
  });

  it("passes correct accountId and assetId to gateway", async () => {
    const holding = { id: "h2", accountId: "acc2" } as never;
    vi.mocked(mockGateway.getHoldingDetail).mockResolvedValue(holding);

    const useCase = new GetHoldingDetailUseCase(mockGateway);
    await useCase.execute("acc2", "MSFT");

    expect(mockGateway.getHoldingDetail).toHaveBeenCalledWith("acc2", "MSFT");
  });

  it("propagates error when account is unknown", async () => {
    const error = new ApiError("Account not found", 404);
    vi.mocked(mockGateway.getHoldingDetail).mockRejectedValue(error);

    const useCase = new GetHoldingDetailUseCase(mockGateway);
    await expect(useCase.execute("unknown", "AAPL")).rejects.toThrow(ApiError);
  });

  it("propagates ConnectionError from gateway", async () => {
    const error = new ConnectionError("Connection failed");
    vi.mocked(mockGateway.getHoldingDetail).mockRejectedValue(error);

    const useCase = new GetHoldingDetailUseCase(mockGateway);
    await expect(useCase.execute("acc1", "AAPL")).rejects.toThrow(ConnectionError);
  });
});

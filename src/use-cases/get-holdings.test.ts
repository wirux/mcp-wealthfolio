import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetHoldingsUseCase } from "./get-holdings.js";
import { ConnectionError } from "../domain/errors/connection-error.js";

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

describe("GetHoldingsUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all holdings when no accountId provided", async () => {
    const holdings = [{ id: "h1" }, { id: "h2" }] as never;
    vi.mocked(mockGateway.getHoldings).mockResolvedValue(holdings);

    const useCase = new GetHoldingsUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(holdings);
    expect(mockGateway.getHoldings).toHaveBeenCalledWith(undefined);
  });

  it("passes accountId to gateway when provided", async () => {
    const holdings = [{ id: "h1" }] as never;
    vi.mocked(mockGateway.getHoldings).mockResolvedValue(holdings);

    const useCase = new GetHoldingsUseCase(mockGateway);
    const result = await useCase.execute("acc1");

    expect(result).toBe(holdings);
    expect(mockGateway.getHoldings).toHaveBeenCalledWith("acc1");
  });

  it("returns empty list when gateway returns no holdings", async () => {
    vi.mocked(mockGateway.getHoldings).mockResolvedValue([]);

    const useCase = new GetHoldingsUseCase(mockGateway);
    const result = await useCase.execute("acc1");

    expect(result).toEqual([]);
  });

  it("propagates ConnectionError from gateway", async () => {
    const error = new ConnectionError("Connection failed");
    vi.mocked(mockGateway.getHoldings).mockRejectedValue(error);

    const useCase = new GetHoldingsUseCase(mockGateway);
    await expect(useCase.execute()).rejects.toThrow(ConnectionError);
  });
});

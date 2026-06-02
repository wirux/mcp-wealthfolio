import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetAllocationUseCase } from "./get-allocation.js";
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

describe("GetAllocationUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allocation from gateway", async () => {
    const allocation = { items: [{ label: "Stocks", weight: 0.6 }] } as never;
    vi.mocked(mockGateway.getAllocations).mockResolvedValue(allocation);

    const useCase = new GetAllocationUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(allocation);
    expect(mockGateway.getAllocations).toHaveBeenCalledWith(undefined);
  });

  it("passes accountId to gateway", async () => {
    const allocation = { items: [] } as never;
    vi.mocked(mockGateway.getAllocations).mockResolvedValue(allocation);

    const useCase = new GetAllocationUseCase(mockGateway);
    const result = await useCase.execute("acc-123");

    expect(result).toBe(allocation);
    expect(mockGateway.getAllocations).toHaveBeenCalledWith("acc-123");
  });

  it("returns allocation with empty items for empty portfolio", async () => {
    const allocation = { items: [] } as never;
    vi.mocked(mockGateway.getAllocations).mockResolvedValue(allocation);

    const useCase = new GetAllocationUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(allocation);
  });

  it("propagates ConnectionError from gateway", async () => {
    const error = new ConnectionError("Connection failed");
    vi.mocked(mockGateway.getAllocations).mockRejectedValue(error);

    const useCase = new GetAllocationUseCase(mockGateway);
    await expect(useCase.execute()).rejects.toThrow(ConnectionError);
  });
});

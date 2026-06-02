import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { ListAccountsUseCase } from "./list-accounts.js";
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

describe("ListAccountsUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns accounts from gateway", async () => {
    const accounts = [{ id: "acc1" }, { id: "acc2" }] as never;
    vi.mocked(mockGateway.listAccounts).mockResolvedValue(accounts);

    const useCase = new ListAccountsUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toBe(accounts);
    expect(mockGateway.listAccounts).toHaveBeenCalledOnce();
  });

  it("returns empty list when gateway returns no accounts", async () => {
    vi.mocked(mockGateway.listAccounts).mockResolvedValue([]);

    const useCase = new ListAccountsUseCase(mockGateway);
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it("propagates ConnectionError from gateway", async () => {
    const error = new ConnectionError("Connection failed");
    vi.mocked(mockGateway.listAccounts).mockRejectedValue(error);

    const useCase = new ListAccountsUseCase(mockGateway);
    await expect(useCase.execute()).rejects.toThrow(ConnectionError);
  });
});

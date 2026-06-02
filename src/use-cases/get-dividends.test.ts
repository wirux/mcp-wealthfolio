import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetDividendsUseCase } from "./get-dividends.js";

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

describe("GetDividendsUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auto-sets activityTypeFilter to DIVIDEND", async () => {
    const result = { activities: [], total: 0 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const useCase = new GetDividendsUseCase(mockGateway);
    await useCase.execute({});

    const calledWith = vi.mocked(mockGateway.searchActivities).mock.calls[0]?.[0];
    expect(calledWith?.activityTypeFilter).toEqual(["DIVIDEND"]);
  });

  it("sets dateFrom and dateTo when year is provided", async () => {
    const result = { activities: [], total: 0 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const useCase = new GetDividendsUseCase(mockGateway);
    await useCase.execute({ year: 2024 });

    const calledWith = vi.mocked(mockGateway.searchActivities).mock.calls[0]?.[0];
    expect(calledWith?.dateFrom).toBe("2024-01-01");
    expect(calledWith?.dateTo).toBe("2024-12-31");
  });

  it("does not set date filters when year is omitted", async () => {
    const result = { activities: [], total: 0 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const useCase = new GetDividendsUseCase(mockGateway);
    await useCase.execute({});

    const calledWith = vi.mocked(mockGateway.searchActivities).mock.calls[0]?.[0];
    expect(calledWith?.dateFrom).toBeUndefined();
    expect(calledWith?.dateTo).toBeUndefined();
  });

  it("passes accountId as accountIdFilter when provided", async () => {
    const result = { activities: [], total: 0 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const useCase = new GetDividendsUseCase(mockGateway);
    await useCase.execute({ accountId: "acc42" });

    const calledWith = vi.mocked(mockGateway.searchActivities).mock.calls[0]?.[0];
    expect(calledWith?.accountIdFilter).toEqual(["acc42"]);
  });

  it("does not set accountIdFilter when accountId is omitted", async () => {
    const result = { activities: [], total: 0 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const useCase = new GetDividendsUseCase(mockGateway);
    await useCase.execute({});

    const calledWith = vi.mocked(mockGateway.searchActivities).mock.calls[0]?.[0];
    expect(calledWith?.accountIdFilter).toBeUndefined();
  });
});

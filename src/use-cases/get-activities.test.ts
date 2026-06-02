import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WealthfolioGateway } from "../domain/ports/wealthfolio-gateway.js";
import { GetActivitiesUseCase } from "./get-activities.js";
import { ActivitySearchCriteria } from "../domain/entities/activity-search-criteria.js";

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

describe("GetActivitiesUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns activities for given criteria", async () => {
    const result = { activities: [], total: 0 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const criteria = ActivitySearchCriteria.create();
    const useCase = new GetActivitiesUseCase(mockGateway);
    const output = await useCase.execute(criteria);

    expect(output).toBe(result);
    expect(mockGateway.searchActivities).toHaveBeenCalledWith(criteria);
  });

  it("passes criteria with filters to gateway", async () => {
    const result = { activities: [{ id: "a1" }] as never, total: 1 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const criteria = ActivitySearchCriteria.create({ activityTypeFilter: ["BUY"], accountIdFilter: ["acc1"] });
    const useCase = new GetActivitiesUseCase(mockGateway);
    const output = await useCase.execute(criteria);

    expect(output).toBe(result);
    expect(mockGateway.searchActivities).toHaveBeenCalledWith(criteria);
  });

  it("propagates empty results from gateway", async () => {
    const result = { activities: [], total: 0 };
    vi.mocked(mockGateway.searchActivities).mockResolvedValue(result);

    const criteria = ActivitySearchCriteria.create({ activityTypeFilter: ["SELL"] });
    const useCase = new GetActivitiesUseCase(mockGateway);
    const output = await useCase.execute(criteria);

    expect(output.activities).toHaveLength(0);
    expect(output.total).toBe(0);
  });
});

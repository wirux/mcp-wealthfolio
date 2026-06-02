import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivitySearchCriteria } from "../../domain/entities/activity-search-criteria.js";
import type { WealthfolioClient } from "./client.js";
import { WealthfolioGatewayAdapter } from "./gateway.js";

type MockClient = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

function createMockClient(): MockClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
  };
}

describe("WealthfolioGatewayAdapter", () => {
  let mockClient: MockClient;
  let gateway: WealthfolioGatewayAdapter;

  beforeEach(() => {
    mockClient = createMockClient();
    gateway = new WealthfolioGatewayAdapter(mockClient as unknown as WealthfolioClient);
  });

  it("listAccounts returns mapped Account[]", async () => {
    mockClient.get.mockResolvedValue([
      {
        id: "acc-1",
        name: "Brokerage",
        currency: "USD",
        isActive: true,
        group: "Taxable",
      },
    ]);

    const result = await gateway.listAccounts();

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/accounts");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("acc-1");
    expect(result[0]?.currency.code).toBe("USD");
    expect(result[0]?.group).toBe("Taxable");
  });

  it("getHoldings without accountId fetches per-account", async () => {
    mockClient.get.mockImplementation((path: string, params?: Record<string, string>) => {
      if (path === "/api/v1/accounts") {
        return Promise.resolve([
          { id: "acc-1", name: "Main", currency: "USD", isActive: true },
        ]);
      }
      if (path === "/api/v1/holdings" && params?.accountId === "acc-1") {
        return Promise.resolve([
          {
            id: "holding-1",
            accountId: "acc-1",
            instrument: { symbol: "AAPL", currency: "USD" },
            quantity: 10,
            marketValue: { local: 1800, base: 1800 },
            costBasis: { local: 1500, base: 1500 },
            unrealizedGain: { local: 300, base: 300 },
            unrealizedGainPct: 0.2,
            weight: 0.3,
            localCurrency: "USD",
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await gateway.getHoldings();

    expect(result).toHaveLength(1);
    expect(result[0]?.symbol.value).toBe("AAPL");
    expect(result[0]?.marketValue.amount).toBe(1800);
  });

  it("getHoldings with accountId passes query params", async () => {
    mockClient.get.mockResolvedValue([]);

    await gateway.getHoldings("acc-7");

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/holdings", { accountId: "acc-7" });
  });

  it("getHoldingDetail requests item endpoint and maps holding", async () => {
    const assetUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    mockClient.get.mockResolvedValue({
      id: "holding-2",
      accountId: "acc-2",
      instrument: { symbol: "VXUS", currency: "USD" },
      quantity: 4,
      marketValue: { local: 250, base: 250 },
      costBasis: { local: 200, base: 200 },
      unrealizedGain: { local: 50, base: 50 },
      unrealizedGainPct: 0.25,
      weight: 0.05,
      holdingType: "ETF",
      localCurrency: "USD",
    });

    const result = await gateway.getHoldingDetail("acc-2", assetUuid);

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/holdings/item", {
      accountId: "acc-2",
      assetId: assetUuid,
    });
    expect(result.assetType).toBe("ETF");
    expect(result.quantity.value).toBe(4);
  });

  it("getAllocations returns Allocation for specific account", async () => {
    mockClient.get.mockResolvedValue({
      assetClasses: {
        taxonomyId: "asset_classes",
        taxonomyName: "Asset Classes",
        color: "#879a39",
        categories: [
          { categoryId: "EQUITY", categoryName: "Equity", color: "#4385be", value: 6000, percentage: 60 },
          { categoryId: "FIXED_INCOME", categoryName: "Fixed Income", color: "#a0a0a0", value: 4000, percentage: 40 },
        ],
      },
      sectors: {
        taxonomyId: "sectors",
        taxonomyName: "Sectors",
        color: "#111111",
        categories: [
          { categoryId: "TECH", categoryName: "Technology", color: "#ff0000", value: 5000, percentage: 50 },
        ],
      },
      customGroups: [],
      totalValue: 10000,
    });

    const result = await gateway.getAllocations("acc-1");

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/allocations", { accountId: "acc-1" });
    expect(result.items[0]?.label).toBe("Asset Classes");
    expect(result.items[0]?.children?.[0]?.label).toBe("Equity");
    expect(result.items[0]?.children?.[0]?.weight.value).toBeCloseTo(0.6);
    expect(result.items[0]?.children?.[1]?.label).toBe("Fixed Income");
    expect(result.items[1]?.label).toBe("Sectors");
  });

  it("getAllocations without accountId fetches all accounts", async () => {
    mockClient.get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/accounts") {
        return [
          { id: "acc-1", name: "Account 1", currency: "USD", isActive: true },
        ];
      }
      return {
        assetClasses: {
          taxonomyId: "asset_classes",
          taxonomyName: "Asset Classes",
          color: "#879a39",
          categories: [
            { categoryId: "BONDS", categoryName: "Bonds", color: "#aaa", value: 3000, percentage: 30 },
          ],
        },
        customGroups: [],
        totalValue: 3000,
      };
    });

    const result = await gateway.getAllocations();

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/accounts");
    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/allocations", { accountId: "acc-1" });
    expect(result.items[0]?.label).toBe("Asset Classes");
    expect(result.items[0]?.children?.[0]?.label).toBe("Bonds");
  });

  it("getPerformanceSummary passes date params and maps values", async () => {
    mockClient.post.mockResolvedValue({
      totalValue: 12000,
      gainLossAmount: 2000,
      simpleReturn: 0.2,
      cumulativeTwr: 0.12,
      cumulativeMwr: 0.1,
      currency: "USD",
      periodStartDate: "2024-01-01",
      periodEndDate: "2024-12-31",
    });

    const result = await gateway.getPerformanceSummary("2024-01-01", "2024-12-31");

    expect(mockClient.post).toHaveBeenCalledWith("/api/v1/performance/summary", {
      itemType: "account",
      itemId: "TOTAL",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(result.totalValue.amount).toBe(12000);
    expect(result.period?.to).toBe("2024-12-31");
  });

  it("getPerformanceHistory passes params and maps data points", async () => {
    mockClient.post.mockResolvedValue({
      currency: "USD",
      returns: [
        { date: "2024-01-01", totalValue: 10000 },
        { date: "2024-02-01", totalValue: 10400 },
      ],
    });

    const result = await gateway.getPerformanceHistory({
      itemType: "portfolio",
      itemId: "acc-1",
      startDate: "2024-01-01",
      endDate: "2024-02-01",
    });

    expect(mockClient.post).toHaveBeenCalledWith("/api/v1/performance/history", {
      itemType: "portfolio",
      itemId: "acc-1",
      startDate: "2024-01-01",
      endDate: "2024-02-01",
    });
    expect(result.dataPoints).toHaveLength(2);
  });

  it("searchActivities posts criteria body and returns ActivitySearchResult", async () => {
    mockClient.post.mockResolvedValue({
      data: [
        {
          id: "act-1",
          accountId: "acc-1",
          activityType: "DIVIDEND",
          assetId: "instrument-uuid-1",
          amount: 25,
          currency: "USD",
          date: "2024-03-10",
          comment: "Quarterly dividend",
        },
      ],
      total: 1,
    });
    mockClient.get.mockResolvedValue([
      {
        id: "h-1",
        accountId: "acc-1",
        instrument: { id: "instrument-uuid-1", symbol: "AAPL", currency: "USD" },
        quantity: 10,
        marketValue: { local: 1000, base: 1000 },
        costBasis: { local: 800, base: 800 },
        unrealizedGain: { local: 200, base: 200 },
        unrealizedGainPct: 0.25,
        weight: 1,
        localCurrency: "USD",
      },
    ]);

    const criteria = ActivitySearchCriteria.create({
      accountIdFilter: ["acc-1"],
      activityTypeFilter: ["DIVIDEND"],
      assetIdKeyword: "AAPL",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
      page: 2,
      pageSize: 50,
      sort: { field: "date", direction: "desc" },
    });

    const result = await gateway.searchActivities(criteria);

    expect(mockClient.post).toHaveBeenCalledWith("/api/v1/activities/search", {
      accountIdFilter: ["acc-1"],
      activityTypeFilter: ["DIVIDEND"],
      assetIdKeyword: "AAPL",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
      page: 2,
      pageSize: 50,
      sort: { field: "date", direction: "desc" },
    });
    expect(result.total).toBe(1);
    expect(result.activities[0]?.activityType).toBe("DIVIDEND");
    expect(result.activities[0]?.symbol?.value).toBe("AAPL");
    expect(result.activities[0]?.totalAmount.amount).toBe(25);
    expect(result.activities[0]?.description).toBe("Quarterly dividend");
  });

  it("getNetWorth returns NetWorth", async () => {
    mockClient.get.mockResolvedValue({
      totalNetWorth: 15000,
      investments: 12000,
      otherAssets: 5000,
      liabilities: 2000,
      asOf: "2024-12-31",
      currency: "USD",
    });

    const result = await gateway.getNetWorth();

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/net-worth");
    expect(result.totalNetWorth.amount).toBe(15000);
    expect(result.liabilities?.amount).toBe(2000);
  });

  it("getExchangeRates returns ExchangeRate[]", async () => {
    mockClient.get.mockResolvedValue([
      { fromCurrency: "USD", toCurrency: "EUR", rate: 0.91, timestamp: "2024-05-01T00:00:00Z" },
      { fromCurrency: "USD", toCurrency: "PLN", rate: 4.02, timestamp: "2024-05-01T00:00:00Z" },
    ]);

    const result = await gateway.getExchangeRates();

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/exchange-rates/latest");
    expect(result).toHaveLength(2);
    expect(result[1]?.to.code).toBe("PLN");
  });

  it("checkHealth returns healthy true on successful response", async () => {
    mockClient.get.mockResolvedValue({ status: "ok", version: "1.2.3" });

    const result = await gateway.checkHealth();

    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/healthz");
    expect(result).toEqual({ healthy: true, version: "1.2.3" });
  });

  it("checkHealth returns healthy false when client throws", async () => {
    mockClient.get.mockRejectedValue(new Error("unreachable"));

    await expect(gateway.checkHealth()).resolves.toEqual({ healthy: false });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "../../src/domain/ports/logger.js";
import { DomainError } from "../../src/domain/errors/domain-error.js";
import { createServer } from "../../src/presentation/server.js";

type ExecuteMock = ReturnType<typeof vi.fn>;

type MockUseCases = {
  listAccounts: { execute: ExecuteMock };
  getHoldings: { execute: ExecuteMock };
  getHoldingDetail: { execute: ExecuteMock };
  getAllocation: { execute: ExecuteMock };
  getPerformanceSummary: { execute: ExecuteMock };
  getPerformanceHistory: { execute: ExecuteMock };
  getActivities: { execute: ExecuteMock };
  getDividends: { execute: ExecuteMock };
  getNetWorth: { execute: ExecuteMock };
  getHealth: { execute: ExecuteMock };
  getExchangeRates: { execute: ExecuteMock };
  syncPrices: { execute: ExecuteMock };
  computeRebalancing: { execute: ExecuteMock };
};

type ToolCallResult = Awaited<ReturnType<Client["callTool"]>>;
type ToolContentResult = ToolCallResult & { content: Array<{ type: string; text?: string }> };

class TestDomainError extends DomainError {
  readonly code = "TEST_DOMAIN_ERROR";
}

const logger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const ALL_TOOL_NAMES = [
  "list_accounts",
  "get_holdings",
  "get_holding_detail",
  "get_allocation",
  "get_performance_summary",
  "get_performance_history",
  "get_exchange_rates",
  "get_activities",
  "get_dividends",
  "get_net_worth",
  "get_health",
  "compute_rebalancing",
  "sync_prices",
] as const;

function createMockUseCases(): MockUseCases {
  return {
    listAccounts: { execute: vi.fn() },
    getHoldings: { execute: vi.fn() },
    getHoldingDetail: { execute: vi.fn() },
    getAllocation: { execute: vi.fn() },
    getPerformanceSummary: { execute: vi.fn() },
    getPerformanceHistory: { execute: vi.fn() },
    getActivities: { execute: vi.fn() },
    getDividends: { execute: vi.fn() },
    getNetWorth: { execute: vi.fn() },
    getHealth: { execute: vi.fn() },
    getExchangeRates: { execute: vi.fn() },
    syncPrices: { execute: vi.fn() },
    computeRebalancing: { execute: vi.fn() },
  };
}

function asContentResult(result: ToolCallResult): ToolContentResult {
  if (!("content" in result)) {
    throw new Error("Expected MCP tool result with content");
  }

  return result as ToolContentResult;
}

function getTextContent(result: ToolCallResult): string {
  const contentResult = asContentResult(result);
  const firstItem = contentResult.content[0];

  if (firstItem?.type !== "text" || typeof firstItem.text !== "string") {
    throw new Error("Expected first MCP content item to be text");
  }

  return firstItem.text;
}

describe("MCP Server E2E", () => {
  let client: Client;
  let server: McpServer;
  let mockUseCases: MockUseCases;

  beforeEach(async () => {
    mockUseCases = createMockUseCases();

    server = createServer({
      config: { transportType: "stdio", httpPort: 0 },
      logger,
      useCases: mockUseCases as unknown as Parameters<typeof createServer>[0]["useCases"],
    });

    client = new Client({ name: "test-client", version: "0.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await Promise.all([client.close(), server.close()]);
  });

  it("registers all 13 MCP tools", async () => {
    const result = await client.listTools();
    const toolNames = result.tools.map((tool) => tool.name);

    expect(toolNames).toEqual(ALL_TOOL_NAMES);
  });

  it("list_accounts returns accounts", async () => {
    const accounts = [
      { id: "acc-1", name: "Brokerage", provider: "Demo Broker", currency: "USD" },
      { id: "acc-2", name: "Retirement", provider: "Demo Broker", currency: "USD" },
    ];
    mockUseCases.listAccounts.execute.mockResolvedValue(accounts);

    const result = asContentResult(await client.callTool({ name: "list_accounts", arguments: {} }));

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(accounts);
    expect(mockUseCases.listAccounts.execute).toHaveBeenCalledOnce();
  });

  it("get_holdings returns holdings for the requested account", async () => {
    const holdings = [
      { id: "h-1", accountId: "acc-1", symbol: "AAPL", quantity: 10, marketValue: 1800 },
      { id: "h-2", accountId: "acc-1", symbol: "MSFT", quantity: 5, marketValue: 2100 },
    ];
    mockUseCases.getHoldings.execute.mockResolvedValue(holdings);

    const result = asContentResult(
      await client.callTool({
        name: "get_holdings",
        arguments: { account_id: "acc-1" },
      }),
    );

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(holdings);
    expect(mockUseCases.getHoldings.execute).toHaveBeenCalledWith("acc-1");
  });

  it("get_holding_detail returns holding details", async () => {
    const holdingDetail = {
      id: "asset-1",
      accountId: "acc-1",
      symbol: "AAPL",
      quantity: 10,
      marketValue: 1800,
      costBasis: 1500,
    };
    mockUseCases.getHoldingDetail.execute.mockResolvedValue(holdingDetail);

    const result = asContentResult(
      await client.callTool({
        name: "get_holding_detail",
        arguments: { account_id: "acc-1", asset_id: "asset-1" },
      }),
    );

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(holdingDetail);
    expect(mockUseCases.getHoldingDetail.execute).toHaveBeenCalledWith("acc-1", "asset-1");
  });

  it("get_allocation returns allocation breakdown", async () => {
    const allocation = {
      byAssetClass: { equities: 0.75, cash: 0.25 },
      byCurrency: { USD: 0.9, EUR: 0.1 },
    };
    mockUseCases.getAllocation.execute.mockResolvedValue(allocation);

    const result = asContentResult(await client.callTool({ name: "get_allocation", arguments: {} }));

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(allocation);
    expect(mockUseCases.getAllocation.execute).toHaveBeenCalledOnce();
  });

  it("get_performance_summary passes through date filters", async () => {
    const summary = {
      totalReturn: 0.14,
      annualizedReturn: 0.09,
      timeWeightedReturn: 0.12,
    };
    mockUseCases.getPerformanceSummary.execute.mockResolvedValue(summary);

    const result = asContentResult(
      await client.callTool({
        name: "get_performance_summary",
        arguments: { from: "2024-01-01", to: "2024-12-31" },
      }),
    );

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(summary);
    expect(mockUseCases.getPerformanceSummary.execute).toHaveBeenCalledWith(
      "2024-01-01",
      "2024-12-31",
    );
  });

  it("get_performance_history maps MCP arguments to use-case params", async () => {
    const history = [
      { date: "2024-01-01", value: 10000 },
      { date: "2024-02-01", value: 10550 },
    ];
    mockUseCases.getPerformanceHistory.execute.mockResolvedValue(history);

    const result = asContentResult(
      await client.callTool({
        name: "get_performance_history",
        arguments: {
          item_type: "account",
          item_id: "acc-1",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
      }),
    );

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(history);
    expect(mockUseCases.getPerformanceHistory.execute).toHaveBeenCalledWith({
      itemType: "account",
      itemId: "acc-1",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
  });

  it("get_activities builds search criteria from MCP filters", async () => {
    const activities = {
      activities: [
        { id: "act-1", accountId: "acc-1", activityType: "BUY", symbol: "AAPL" },
      ],
      total: 1,
    };
    mockUseCases.getActivities.execute.mockResolvedValue(activities);

    const result = asContentResult(
      await client.callTool({
        name: "get_activities",
        arguments: {
          account_id: "acc-1",
          activity_types: ["BUY", "SELL"],
          symbol_keyword: "AAP",
          date_from: "2024-01-01",
          date_to: "2024-12-31",
          page: 2,
          page_size: 50,
        },
      }),
    );

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(activities);
    expect(mockUseCases.getActivities.execute).toHaveBeenCalledOnce();
    expect(mockUseCases.getActivities.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountIdFilter: ["acc-1"],
        activityTypeFilter: ["BUY", "SELL"],
        assetIdKeyword: "AAP",
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        page: 2,
        pageSize: 50,
      }),
    );
  });

  it("get_dividends passes filters to the use-case", async () => {
    const dividends = {
      activities: [
        { id: "div-1", accountId: "acc-1", activityType: "DIVIDEND", amount: 42.5 },
      ],
      total: 1,
    };
    mockUseCases.getDividends.execute.mockResolvedValue(dividends);

    const result = asContentResult(
      await client.callTool({
        name: "get_dividends",
        arguments: { account_id: "acc-1", year: 2024 },
      }),
    );

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(dividends);
    expect(mockUseCases.getDividends.execute).toHaveBeenCalledWith({
      accountId: "acc-1",
      year: 2024,
    });
  });

  it("get_net_worth returns current net worth", async () => {
    const netWorth = {
      totalValue: 152340.22,
      dailyChange: 840.13,
      currency: "USD",
    };
    mockUseCases.getNetWorth.execute.mockResolvedValue(netWorth);

    const result = asContentResult(await client.callTool({ name: "get_net_worth", arguments: {} }));

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(netWorth);
    expect(mockUseCases.getNetWorth.execute).toHaveBeenCalledOnce();
  });

  it("get_health returns health status", async () => {
    const health = { healthy: true, version: "0.0.0" };
    mockUseCases.getHealth.execute.mockResolvedValue(health);

    const result = asContentResult(await client.callTool({ name: "get_health", arguments: {} }));

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(health);
    expect(mockUseCases.getHealth.execute).toHaveBeenCalledOnce();
  });

  it("get_exchange_rates returns exchange rates", async () => {
    const rates = [{ from: "USD", to: "EUR", rate: 0.85, date: "2024-01-01" }];
    mockUseCases.getExchangeRates.execute.mockResolvedValue(rates);

    const result = asContentResult(await client.callTool({ name: "get_exchange_rates", arguments: {} }));

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(getTextContent(result))).toEqual(rates);
    expect(mockUseCases.getExchangeRates.execute).toHaveBeenCalledOnce();
  });

  it("sync_prices returns success message", async () => {
    mockUseCases.syncPrices.execute.mockResolvedValue(undefined);

    const result = asContentResult(await client.callTool({ name: "sync_prices", arguments: {} }));

    expect(result.isError).toBeFalsy();
    expect(getTextContent(result)).toBe("Prices synced successfully.");
    expect(mockUseCases.syncPrices.execute).toHaveBeenCalledOnce();
  });

   it("compute_rebalancing returns JSON with recommendations using fetched holdings", async () => {
    const holdings = [
      {
        id: "hold-1",
        accountId: "acc-1",
        symbol: { value: "AAPL" },
        marketValue: { amount: 6000, currency: { code: "USD" } },
      },
      {
        id: "hold-2",
        accountId: "acc-1",
        symbol: { value: "MSFT" },
        marketValue: { amount: 4000, currency: { code: "USD" } },
      },
    ];
    const plan = {
      drifts: [
        {
          symbol: { value: "AAPL" },
          currentWeight: { value: 0.6 },
          targetWeight: { value: 0.5 },
          driftPercent: -0.1,
          action: "sell",
          deltaValue: { amount: -1000, currency: { code: "USD" } },
          absoluteDrift: 0.1,
        },
        {
          symbol: { value: "MSFT" },
          currentWeight: { value: 0.4 },
          targetWeight: { value: 0.5 },
          driftPercent: 0.1,
          action: "buy",
          deltaValue: { amount: 1000, currency: { code: "USD" } },
          absoluteDrift: 0.1,
        },
      ],
      totalValue: { amount: 10000, currency: { code: "USD" } },
      targetAllocation: {},
    };
    mockUseCases.getHoldings.execute.mockResolvedValue(holdings);
    mockUseCases.computeRebalancing.execute.mockReturnValue(plan);

    const result = asContentResult(
      await client.callTool({
        name: "compute_rebalancing",
        arguments: {
          account_id: "acc-1",
          target_weights: { AAPL: 0.5, MSFT: 0.5 },
          cash_to_invest: 0,
        },
      }),
    );

    const text = getTextContent(result);

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(text);
    expect(parsed).toHaveProperty("totalValue", 10000);
    expect(parsed).toHaveProperty("recommendations");
    expect(Array.isArray(parsed.recommendations)).toBe(true);
    const aapl = parsed.recommendations.find((r: { symbol: string }) => r.symbol === "AAPL");
    const msft = parsed.recommendations.find((r: { symbol: string }) => r.symbol === "MSFT");
    expect(aapl).toBeDefined();
    expect(msft).toBeDefined();
    expect(aapl.action).toBe("sell");
    expect(msft.action).toBe("buy");
    expect(mockUseCases.getHoldings.execute).toHaveBeenCalledWith("acc-1");
    expect(mockUseCases.computeRebalancing.execute).toHaveBeenCalledWith({
      holdings,
      targetWeights: { AAPL: 0.5, MSFT: 0.5 },
      cashToInvest: 0,
    });
  });

  it("returns MCP isError=true when a tool use-case throws a DomainError", async () => {
    const error = new TestDomainError("Simulated domain failure");

    mockUseCases.listAccounts.execute.mockRejectedValueOnce(error);
    let result = asContentResult(await client.callTool({ name: "list_accounts", arguments: {} }));
    expect(result.isError).toBe(true);
    expect(getTextContent(result)).toBe("Simulated domain failure");

    mockUseCases.getHoldings.execute.mockRejectedValueOnce(error);
    result = asContentResult(
      await client.callTool({ name: "get_holdings", arguments: { account_id: "acc-1" } }),
    );
    expect(result.isError).toBe(true);

    mockUseCases.getHoldingDetail.execute.mockRejectedValueOnce(error);
    result = asContentResult(
      await client.callTool({
        name: "get_holding_detail",
        arguments: { account_id: "acc-1", asset_id: "asset-1" },
      }),
    );
    expect(result.isError).toBe(true);

    mockUseCases.getAllocation.execute.mockRejectedValueOnce(error);
    result = asContentResult(await client.callTool({ name: "get_allocation", arguments: {} }));
    expect(result.isError).toBe(true);

    mockUseCases.getPerformanceSummary.execute.mockRejectedValueOnce(error);
    result = asContentResult(
      await client.callTool({
        name: "get_performance_summary",
        arguments: { from: "2024-01-01", to: "2024-12-31" },
      }),
    );
    expect(result.isError).toBe(true);

    mockUseCases.getPerformanceHistory.execute.mockRejectedValueOnce(error);
    result = asContentResult(
      await client.callTool({
        name: "get_performance_history",
        arguments: { item_type: "account", item_id: "acc-1" },
      }),
    );
    expect(result.isError).toBe(true);

    mockUseCases.getActivities.execute.mockRejectedValueOnce(error);
    result = asContentResult(
      await client.callTool({
        name: "get_activities",
        arguments: { account_id: "acc-1", activity_types: ["BUY"] },
      }),
    );
    expect(result.isError).toBe(true);

    mockUseCases.getDividends.execute.mockRejectedValueOnce(error);
    result = asContentResult(
      await client.callTool({
        name: "get_dividends",
        arguments: { account_id: "acc-1", year: 2024 },
      }),
    );
    expect(result.isError).toBe(true);

    mockUseCases.getNetWorth.execute.mockRejectedValueOnce(error);
    result = asContentResult(await client.callTool({ name: "get_net_worth", arguments: {} }));
    expect(result.isError).toBe(true);

    mockUseCases.getHealth.execute.mockRejectedValueOnce(error);
    result = asContentResult(await client.callTool({ name: "get_health", arguments: {} }));
    expect(result.isError).toBe(true);

    mockUseCases.getExchangeRates.execute.mockRejectedValueOnce(error);
    result = asContentResult(await client.callTool({ name: "get_exchange_rates", arguments: {} }));
    expect(result.isError).toBe(true);

    mockUseCases.syncPrices.execute.mockRejectedValueOnce(error);
    result = asContentResult(await client.callTool({ name: "sync_prices", arguments: {} }));
    expect(result.isError).toBe(true);

    mockUseCases.getHoldings.execute.mockRejectedValueOnce(error);
    result = asContentResult(
      await client.callTool({
        name: "compute_rebalancing",
        arguments: { target_weights: { AAPL: 1 } },
      }),
    );
    expect(result.isError).toBe(true);
  });
});

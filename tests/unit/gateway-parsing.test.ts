import { beforeEach, describe, expect, it, vi } from "vitest";
import { WealthfolioGatewayAdapter } from "../../src/infrastructure/wealthfolio/gateway.js";
import type { WealthfolioClient } from "../../src/infrastructure/wealthfolio/client.js";

function createMockClient(responses: Record<string, unknown>): WealthfolioClient {
  return {
    get: vi.fn((path: string) => {
      if (path in responses) {
        return Promise.resolve(responses[path]);
      }
      return Promise.reject(new Error(`No mock for ${path}`));
    }),
    post: vi.fn((path: string) => {
      if (path in responses) {
        return Promise.resolve(responses[path]);
      }
      return Promise.reject(new Error(`No mock for ${path}`));
    }),
  } as unknown as WealthfolioClient;
}

describe("WealthfolioGatewayAdapter - Holdings with empty symbol (Bug 3)", () => {
  it("filters out holdings with empty symbol (cash positions)", async () => {
    const client = createMockClient({
      "/api/v1/holdings": [
        {
          id: "h1",
          accountId: "acc1",
          instrument: { symbol: "AAPL", currency: "USD" },
          quantity: 10,
          marketValue: { local: 1500, base: 1500 },
          costBasis: { local: 1200, base: 1200 },
          unrealizedGain: { local: 300, base: 300 },
          unrealizedGainPct: 0.25,
          weight: 0.5,
          localCurrency: "USD",
        },
        {
          id: "h2",
          accountId: "acc1",
          instrument: { symbol: "", currency: "USD" },
          quantity: 0,
          marketValue: { local: 500, base: 500 },
          costBasis: { local: 500, base: 500 },
          unrealizedGain: { local: 0, base: 0 },
          unrealizedGainPct: 0,
          weight: 0.2,
          localCurrency: "USD",
        },
        {
          id: "h3",
          accountId: "acc1",
          instrument: { symbol: null, currency: "USD" },
          quantity: 0,
          marketValue: { local: 100, base: 100 },
          costBasis: { local: 100, base: 100 },
          unrealizedGain: { local: 0, base: 0 },
          unrealizedGainPct: 0,
          weight: 0.1,
          localCurrency: "USD",
        },
      ],
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const holdings = await gateway.getHoldings("acc1");

    expect(holdings).toHaveLength(1);
    expect(holdings[0]!.symbol.value).toBe("AAPL");
  });

  it("keeps holdings with valid symbols", async () => {
    const client = createMockClient({
      "/api/v1/holdings": [
        {
          id: "h1",
          accountId: "acc1",
          instrument: { symbol: "MSFT", currency: "USD" },
          quantity: 5,
          marketValue: { local: 2000, base: 2000 },
          costBasis: { local: 1800, base: 1800 },
          unrealizedGain: { local: 200, base: 200 },
          unrealizedGainPct: 0.11,
          weight: 0.4,
          localCurrency: "USD",
        },
        {
          id: "h2",
          accountId: "acc1",
          instrument: { symbol: "TSLA", currency: "USD" },
          quantity: 3,
          marketValue: { local: 900, base: 900 },
          costBasis: { local: 1000, base: 1000 },
          unrealizedGain: { local: -100, base: -100 },
          unrealizedGainPct: 0,
          weight: 0.3,
          localCurrency: "USD",
        },
      ],
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const holdings = await gateway.getHoldings("acc1");

    expect(holdings).toHaveLength(2);
  });
});

describe("WealthfolioGatewayAdapter - Activity quantity handling (Bug 2)", () => {
  it("handles activity with null quantity (cash operations)", async () => {
    const client = createMockClient({
      "/api/v1/activities/search": {
        data: [
          {
            id: "act1",
            accountId: "acc1",
            activityType: "DEPOSIT",
            totalAmount: 1000,
            date: "2024-01-15",
            currency: "USD",
            quantity: null,
          },
        ],
        total: 1,
      },
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({
      page: 1,
      pageSize: 10,
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]!.quantity).toBeUndefined();
  });

  it("handles activity with string quantity", async () => {
    const client = createMockClient({
      "/api/v1/activities/search": {
        data: [
          {
            id: "act2",
            accountId: "acc1",
            activityType: "BUY",
            totalAmount: 500,
            date: "2024-01-15",
            currency: "USD",
            symbol: "AAPL",
            quantity: "10",
            unitPrice: 50,
          },
        ],
        total: 1,
      },
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({
      page: 1,
      pageSize: 10,
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]!.quantity?.value).toBe(10);
  });

  it("handles activity with undefined quantity", async () => {
    const client = createMockClient({
      "/api/v1/activities/search": {
        data: [
          {
            id: "act3",
            accountId: "acc1",
            activityType: "INTEREST",
            totalAmount: 5.5,
            date: "2024-02-01",
            currency: "USD",
          },
        ],
        total: 1,
      },
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({
      page: 1,
      pageSize: 10,
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]!.quantity).toBeUndefined();
  });
});

describe("WealthfolioGatewayAdapter - Net worth liabilities as string (Bug 4)", () => {
  it("handles liabilities as string '0'", async () => {
    const client = createMockClient({
      "/api/v1/net-worth": {
        totalNetWorth: 50000,
        investments: 45000,
        otherAssets: 5000,
        liabilities: "0",
        currency: "USD",
        asOf: "2024-01-15",
      },
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const netWorth = await gateway.getNetWorth();

    expect(netWorth.liabilities?.amount).toBe(0);
  });

  it("handles liabilities as string with numeric value", async () => {
    const client = createMockClient({
      "/api/v1/net-worth": {
        totalNetWorth: 50000,
        investments: 45000,
        liabilities: "1500.50",
        currency: "USD",
        asOf: "2024-01-15",
      },
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const netWorth = await gateway.getNetWorth();

    expect(netWorth.liabilities?.amount).toBe(1500.50);
  });

  it("handles liabilities as numeric value (normal case)", async () => {
    const client = createMockClient({
      "/api/v1/net-worth": {
        totalNetWorth: 50000,
        investments: 45000,
        liabilities: 2000,
        currency: "USD",
        asOf: "2024-01-15",
      },
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const netWorth = await gateway.getNetWorth();

    expect(netWorth.liabilities?.amount).toBe(2000);
  });

  it("handles investments as string number", async () => {
    const client = createMockClient({
      "/api/v1/net-worth": {
        totalNetWorth: "50000",
        investments: "45000",
        currency: "USD",
        asOf: "2024-01-15",
      },
    });

    const gateway = new WealthfolioGatewayAdapter(client);
    const netWorth = await gateway.getNetWorth();

    expect(netWorth.totalNetWorth.amount).toBe(50000);
    expect(netWorth.investments.amount).toBe(45000);
  });
});

describe("WealthfolioGatewayAdapter - Activity symbol resolution", () => {
  function makeActivityClient(
    activityData: Record<string, unknown>,
    holdingsData: unknown[] = [],
    assetsData: unknown[] = [],
  ) {
    return {
      get: vi.fn((path: string) => {
        if (path === "/api/v1/holdings") return Promise.resolve(holdingsData);
        if (path === "/api/v1/assets") return Promise.resolve(assetsData);
        return Promise.reject(new Error(`No mock for ${path}`));
      }),
      post: vi.fn((path: string) => {
        if (path === "/api/v1/activities/search")
          return Promise.resolve({ data: [activityData], total: 1 });
        return Promise.reject(new Error(`No mock for ${path}`));
      }),
    } as unknown as WealthfolioClient;
  }

  it("resolves symbol from raw API response when not in symbolMap (sold position)", async () => {
    const client = makeActivityClient({
      id: "act1", accountId: "acc1", activityType: "SELL",
      amount: 1000, date: "2024-01-15", currency: "USD",
      symbol: "AMD", assetId: "uuid-amd", quantity: 5,
    });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("AMD");
  });

  it("uses raw symbol when assetId also in symbolMap", async () => {
    const client = makeActivityClient(
      { id: "act2", accountId: "acc1", activityType: "BUY",
        amount: 500, date: "2024-01-15", currency: "USD",
        symbol: "AAPL", assetId: "uuid-aapl", quantity: 10 },
      [{ instrument: { id: "uuid-aapl", symbol: "AAPL" }, quantity: 10,
         accountId: "acc1", id: "h1", marketValue: { local: 1500, base: 1500 },
         costBasis: { local: 1000, base: 1000 }, unrealizedGain: { local: 500, base: 500 },
         unrealizedGainPct: 0.5, weight: 1.0, localCurrency: "USD" }],
    );
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("AAPL");
  });

  it("falls back to symbolMap when raw symbol is absent", async () => {
    const client = makeActivityClient(
      { id: "act3", accountId: "acc1", activityType: "BUY",
        amount: 500, date: "2024-01-15", currency: "USD",
        assetId: "uuid-msft", quantity: 5 },
      [{ instrument: { id: "uuid-msft", symbol: "MSFT" }, quantity: 5,
         accountId: "acc1", id: "h2", marketValue: { local: 2000, base: 2000 },
         costBasis: { local: 1800, base: 1800 }, unrealizedGain: { local: 200, base: 200 },
         unrealizedGainPct: 0.11, weight: 1.0, localCurrency: "USD" }],
    );
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("MSFT");
  });

  it("falls back to symbolMap when raw symbol is empty string", async () => {
    const client = makeActivityClient(
      { id: "act4", accountId: "acc1", activityType: "BUY",
        amount: 500, date: "2024-01-15", currency: "USD",
        symbol: "", assetId: "uuid-tsla", quantity: 3 },
      [{ instrument: { id: "uuid-tsla", symbol: "TSLA" }, quantity: 3,
         accountId: "acc1", id: "h3", marketValue: { local: 900, base: 900 },
         costBasis: { local: 1000, base: 1000 }, unrealizedGain: { local: -100, base: -100 },
         unrealizedGainPct: 0.0, weight: 1.0, localCurrency: "USD" }],
    );
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("TSLA");
  });

  it("falls back to symbolMap when raw symbol is whitespace", async () => {
    const client = makeActivityClient(
      { id: "act5", accountId: "acc1", activityType: "BUY",
        amount: 500, date: "2024-01-15", currency: "USD",
        symbol: "   ", assetId: "uuid-nvda", quantity: 2 },
      [{ instrument: { id: "uuid-nvda", symbol: "NVDA" }, quantity: 2,
         accountId: "acc1", id: "h4", marketValue: { local: 800, base: 800 },
         costBasis: { local: 600, base: 600 }, unrealizedGain: { local: 200, base: 200 },
         unrealizedGainPct: 0.33, weight: 1.0, localCurrency: "USD" }],
    );
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("NVDA");
  });

  it("has no symbol when raw symbol absent and assetId not in symbolMap", async () => {
    const client = makeActivityClient({
      id: "act6", accountId: "acc1", activityType: "DEPOSIT",
      amount: 5000, date: "2024-01-15", currency: "USD",
    });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol).toBeUndefined();
  });

  it("resolves symbol from assetSymbol field (real API field name)", async () => {
    const client = makeActivityClient({
      id: "act7", accountId: "acc1", activityType: "SELL",
      amount: 2000, date: "2024-02-01", currency: "USD",
      assetSymbol: "GOOG", assetId: "uuid-goog", quantity: 3,
    });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("GOOG");
  });

  it("prefers symbol field over assetSymbol when both present", async () => {
    const client = makeActivityClient({
      id: "act8", accountId: "acc1", activityType: "BUY",
      amount: 1500, date: "2024-02-01", currency: "USD",
      symbol: "VTI", assetSymbol: "VTI-OLD", assetId: "uuid-vti", quantity: 10,
    });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("VTI");
  });

  it("resolves sold position symbol via /api/v1/assets fallback", async () => {
    const client = makeActivityClient(
      { id: "act9", accountId: "acc1", activityType: "SELL",
        amount: 3000, date: "2024-03-01", currency: "USD",
        assetId: "uuid-amd", quantity: 20 },
      [],
      [{ id: "uuid-amd", instrumentSymbol: "AMD" }],
    );
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.activities[0]!.symbol?.value).toBe("AMD");
  });

  it("does not call /api/v1/assets when all assetIds resolved from holdings", async () => {
    const client = makeActivityClient(
      { id: "act10", accountId: "acc1", activityType: "BUY",
        amount: 500, date: "2024-03-01", currency: "USD",
        assetId: "uuid-msft", quantity: 5 },
      [{ instrument: { id: "uuid-msft", symbol: "MSFT" }, quantity: 5,
         accountId: "acc1", id: "h5", marketValue: { local: 2000, base: 2000 },
         costBasis: { local: 1800, base: 1800 }, unrealizedGain: { local: 200, base: 200 },
         unrealizedGainPct: 0.11, weight: 1.0, localCurrency: "USD" }],
    );
    const gateway = new WealthfolioGatewayAdapter(client);
    await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(client.get).not.toHaveBeenCalledWith("/api/v1/assets");
  });
});

describe("WealthfolioGatewayAdapter - Activity search total field", () => {
  function makeSearchClient(responsePayload: Record<string, unknown>) {
    return {
      get: vi.fn((path: string) => {
        if (path === "/api/v1/holdings") return Promise.resolve([]);
        if (path === "/api/v1/assets") return Promise.resolve([]);
        return Promise.reject(new Error(`No mock for ${path}`));
      }),
      post: vi.fn((path: string) => {
        if (path === "/api/v1/activities/search") return Promise.resolve(responsePayload);
        return Promise.reject(new Error(`No mock for ${path}`));
      }),
    } as unknown as WealthfolioClient;
  }

  const sampleActivity = {
    id: "act1", accountId: "acc1", activityType: "DEPOSIT",
    amount: 1000, date: "2024-01-15", currency: "USD",
  };

  it("reads total from 'total' field", async () => {
    const client = makeSearchClient({ data: [sampleActivity], total: 42 });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.total).toBe(42);
  });

  it("reads total from 'totalCount' field when 'total' absent", async () => {
    const client = makeSearchClient({ data: [sampleActivity], totalCount: 99 });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.total).toBe(99);
  });

  it("reads total from 'count' field when 'total' and 'totalCount' absent", async () => {
    const client = makeSearchClient({ data: [sampleActivity], count: 55 });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.total).toBe(55);
  });

  it("falls back to data.length when no total field present", async () => {
    const client = makeSearchClient({ data: [sampleActivity, sampleActivity] });
    const gateway = new WealthfolioGatewayAdapter(client);
    const result = await gateway.searchActivities({ page: 1, pageSize: 10 });
    expect(result.total).toBe(2);
  });
});

describe("WealthfolioGatewayAdapter - Holdings quantity filter", () => {
  function makeHoldingRecord(quantity: number | undefined, symbol = "AAPL") {
    return {
      id: "h1",
      accountId: "acc1",
      instrument: { symbol, currency: "USD" },
      quantity,
      marketValue: { local: 1500, base: 1500 },
      costBasis: { local: 1200, base: 1200 },
      unrealizedGain: { local: 300, base: 300 },
      unrealizedGainPct: 0.25,
      weight: 0.5,
      localCurrency: "USD",
    };
  }

  it("excludes holding with quantity 0", async () => {
    const client = {
      get: vi.fn(() => Promise.resolve([makeHoldingRecord(0)])),
      post: vi.fn(),
    } as unknown as WealthfolioClient;
    const gateway = new WealthfolioGatewayAdapter(client);
    const holdings = await gateway.getHoldings("acc1");
    expect(holdings).toHaveLength(0);
  });

  it("excludes holding with negative quantity", async () => {
    const client = {
      get: vi.fn(() => Promise.resolve([makeHoldingRecord(-1)])),
      post: vi.fn(),
    } as unknown as WealthfolioClient;
    const gateway = new WealthfolioGatewayAdapter(client);
    const holdings = await gateway.getHoldings("acc1");
    expect(holdings).toHaveLength(0);
  });

  it("includes holding with positive quantity", async () => {
    const client = {
      get: vi.fn(() => Promise.resolve([makeHoldingRecord(11.04)])),
      post: vi.fn(),
    } as unknown as WealthfolioClient;
    const gateway = new WealthfolioGatewayAdapter(client);
    const holdings = await gateway.getHoldings("acc1");
    expect(holdings).toHaveLength(1);
    expect(holdings[0]!.quantity.value).toBe(11.04);
  });

  it("includes holding with fractional quantity", async () => {
    const client = {
      get: vi.fn(() => Promise.resolve([makeHoldingRecord(0.001)])),
      post: vi.fn(),
    } as unknown as WealthfolioClient;
    const gateway = new WealthfolioGatewayAdapter(client);
    const holdings = await gateway.getHoldings("acc1");
    expect(holdings).toHaveLength(1);
    expect(holdings[0]!.quantity.value).toBe(0.001);
  });
});

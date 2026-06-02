import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("./infrastructure/wealthfolio/gateway.js", () => ({
  WealthfolioGatewayAdapter: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("./infrastructure/wealthfolio/client.js", () => ({
  WealthfolioClient: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("./infrastructure/wealthfolio/auth-manager.js", () => ({
  AuthManager: vi.fn().mockImplementation(() => ({})),
}));

describe("createApplication", () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
    for (const key of [
      "WEALTHFOLIO_URL",
      "WEALTHFOLIO_PASSWORD",
      "WEALTHFOLIO_PASSWORD_FILE",
      "WEALTHFOLIO_ALLOW_INSECURE",
      "MCP_TRANSPORT_TYPE",
      "PORT",
      "LOG_LEVEL",
    ]) {
      delete process.env[key];
    }
    process.env["WEALTHFOLIO_PASSWORD"] = "test-password";
  });

  afterEach(() => {
    process.env = savedEnv;
    vi.clearAllMocks();
  });

  it("returns an Application object with all required fields", async () => {
    const { createApplication } = await import("./index.js");
    const app = createApplication();

    expect(app).toHaveProperty("config");
    expect(app).toHaveProperty("logger");
    expect(app).toHaveProperty("server");
    expect(app).toHaveProperty("transportResult");
    expect(app).toHaveProperty("useCases");
  });

  it("returns a config with expected shape", async () => {
    const { createApplication } = await import("./index.js");
    const app = createApplication();

    expect(app.config).toMatchObject({
      wealthfolioUrl: expect.any(String),
      mcpTransportType: expect.any(String),
      port: expect.any(Number),
      logLevel: expect.any(String),
    });
  });

  it("returns a logger with expected methods", async () => {
    const { createApplication } = await import("./index.js");
    const app = createApplication();

    expect(typeof app.logger.debug).toBe("function");
    expect(typeof app.logger.info).toBe("function");
    expect(typeof app.logger.warn).toBe("function");
    expect(typeof app.logger.error).toBe("function");
  });

  it("returns a server instance", async () => {
    const { createApplication } = await import("./index.js");
    const app = createApplication();

    expect(app.server).toBeTruthy();
  });

  it("returns useCases with all expected use case keys", async () => {
    const { createApplication } = await import("./index.js");
    const app = createApplication();

    expect(app.useCases).toHaveProperty("listAccounts");
    expect(app.useCases).toHaveProperty("getHoldings");
    expect(app.useCases).toHaveProperty("getHoldingDetail");
    expect(app.useCases).toHaveProperty("getAllocation");
    expect(app.useCases).toHaveProperty("getPerformanceSummary");
    expect(app.useCases).toHaveProperty("getPerformanceHistory");
    expect(app.useCases).toHaveProperty("getActivities");
    expect(app.useCases).toHaveProperty("getDividends");
    expect(app.useCases).toHaveProperty("getNetWorth");
    expect(app.useCases).toHaveProperty("getExchangeRates");
    expect(app.useCases).toHaveProperty("syncPrices");
    expect(app.useCases).toHaveProperty("getHealth");
    expect(app.useCases).toHaveProperty("computeRebalancing");
  });

  it("produces transportResult with kind === 'stdio' when MCP_TRANSPORT_TYPE is stdio", async () => {
    process.env["MCP_TRANSPORT_TYPE"] = "stdio";
    const { createApplication } = await import("./index.js");
    const app = createApplication();

    expect(app.transportResult.kind).toBe("stdio");
  });

  it("produces transportResult with kind === 'http' when MCP_TRANSPORT_TYPE is http", async () => {
    process.env["MCP_TRANSPORT_TYPE"] = "http";
    const { createApplication } = await import("./index.js");
    const app = createApplication();

    expect(app.transportResult.kind).toBe("http");
    if (app.transportResult.kind === "http") {
      expect(typeof app.transportResult.listen).toBe("function");
      expect(typeof app.transportResult.close).toBe("function");
    }
  });

  it("throws a descriptive error when WEALTHFOLIO_PASSWORD is missing", async () => {
    delete process.env["WEALTHFOLIO_PASSWORD"];
    delete process.env["WEALTHFOLIO_PASSWORD_FILE"];
    const { createApplication } = await import("./index.js");

    expect(() => createApplication()).toThrow(
      "WEALTHFOLIO_PASSWORD or WEALTHFOLIO_PASSWORD_FILE is required",
    );
  });
});

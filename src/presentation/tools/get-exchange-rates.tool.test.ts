import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetExchangeRatesUseCase } from "../../use-cases/get-exchange-rates.js";
import { registerGetExchangeRatesTool } from "./get-exchange-rates.tool.js";

function createServer() {
  return new McpServer({ name: "test", version: "0.0.0" });
}

function getHandler(server: McpServer, toolName: string) {
  const tools = Reflect.get(server, "_registeredTools") as Record<
    string,
    { handler: (args: unknown) => Promise<unknown> }
  >;
  const tool = tools[toolName];
  if (!tool) throw new Error(`Tool ${toolName} not registered`);
  return tool.handler;
}

describe("registerGetExchangeRatesTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetExchangeRatesTool(server, { getExchangeRates: mockUseCase as unknown as GetExchangeRatesUseCase });
  });

  it("returns JSON content with exchange rates on success", async () => {
    const rates = [{ from: "USD", to: "EUR", rate: 0.85, date: "2024-01-01" }];
    mockUseCase.execute.mockResolvedValue(rates);

    const handler = getHandler(server, "get_exchange_rates");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: JSON.stringify(rates, null, 2) }],
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Exchange rate error"));

    const handler = getHandler(server, "get_exchange_rates");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: "Exchange rate error" }],
      isError: true,
    });
  });

  it("registers the tool with readOnlyHint annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["get_exchange_rates"]?.annotations?.readOnlyHint).toBe(true);
  });
});

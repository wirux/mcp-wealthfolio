import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetHoldingsUseCase } from "../../use-cases/get-holdings.js";
import { registerGetHoldingsTool } from "./get-holdings.tool.js";

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

describe("registerGetHoldingsTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetHoldingsTool(server, { getHoldings: mockUseCase as unknown as GetHoldingsUseCase });
  });

  it("returns holdings JSON on success without account_id", async () => {
    const holdings = [{ symbol: "AAPL", quantity: 10 }];
    mockUseCase.execute.mockResolvedValue(holdings);

    const handler = getHandler(server, "get_holdings");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(holdings, null, 2) }],
    });
    expect(mockUseCase.execute).toHaveBeenCalledWith(undefined);
  });

  it("passes account_id to use-case when provided", async () => {
    mockUseCase.execute.mockResolvedValue([]);

    const handler = getHandler(server, "get_holdings");
    await handler({ account_id: "acc1" });

    expect(mockUseCase.execute).toHaveBeenCalledWith("acc1");
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Not found"));

    const handler = getHandler(server, "get_holdings");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: "Not found" }],
      isError: true,
    });
  });
});

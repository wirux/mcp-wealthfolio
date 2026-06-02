import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetNetWorthUseCase } from "../../use-cases/get-net-worth.js";
import { registerGetNetWorthTool } from "./get-net-worth.tool.js";

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

describe("registerGetNetWorthTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetNetWorthTool(server, { getNetWorth: mockUseCase as unknown as GetNetWorthUseCase });
  });

  it("returns JSON content with net worth on success", async () => {
    const netWorth = { totalValue: 100000, currency: "USD" };
    mockUseCase.execute.mockResolvedValue(netWorth);

    const handler = getHandler(server, "get_net_worth");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: JSON.stringify(netWorth, null, 2) }],
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Net worth error"));

    const handler = getHandler(server, "get_net_worth");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: "Net worth error" }],
      isError: true,
    });
  });

  it("registers the tool with readOnlyHint annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["get_net_worth"]?.annotations?.readOnlyHint).toBe(true);
  });
});

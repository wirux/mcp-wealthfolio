import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SyncPricesUseCase } from "../../use-cases/sync-prices.js";
import { registerSyncPricesTool } from "./sync-prices.tool.js";

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

describe("registerSyncPricesTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerSyncPricesTool(server, { syncPrices: mockUseCase as unknown as SyncPricesUseCase });
  });

  it("returns success message on successful sync", async () => {
    mockUseCase.execute.mockResolvedValue(undefined);

    const handler = getHandler(server, "sync_prices");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: "Prices synced successfully." }],
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Sync failed"));

    const handler = getHandler(server, "sync_prices");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: "Sync failed" }],
      isError: true,
    });
  });

  it("registers the tool with readOnlyHint=false annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["sync_prices"]?.annotations?.readOnlyHint).toBe(false);
  });
});

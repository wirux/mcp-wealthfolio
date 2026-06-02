import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPerformanceHistoryUseCase } from "../../use-cases/get-performance-history.js";
import { registerGetPerformanceHistoryTool } from "./get-performance-history.tool.js";

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

describe("registerGetPerformanceHistoryTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetPerformanceHistoryTool(server, {
      getPerformanceHistory: mockUseCase as unknown as GetPerformanceHistoryUseCase,
    });
  });

  it("returns performance history JSON on success without params", async () => {
    const history = [{ date: "2024-01-01", value: 10000 }];
    mockUseCase.execute.mockResolvedValue(history);

    const handler = getHandler(server, "get_performance_history");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(history, null, 2) }],
    });
    expect(mockUseCase.execute).toHaveBeenCalledWith({});
  });

  it("passes mapped params to use-case when provided", async () => {
    mockUseCase.execute.mockResolvedValue([]);

    const handler = getHandler(server, "get_performance_history");
    await handler({ item_type: "account", item_id: "acc1", start_date: "2024-01-01", end_date: "2024-12-31" });

    expect(mockUseCase.execute).toHaveBeenCalledWith({
      itemType: "account",
      itemId: "acc1",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("History unavailable"));

    const handler = getHandler(server, "get_performance_history");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: "History unavailable" }],
      isError: true,
    });
  });
});

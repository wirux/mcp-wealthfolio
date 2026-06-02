import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPerformanceSummaryUseCase } from "../../use-cases/get-performance-summary.js";
import { registerGetPerformanceSummaryTool } from "./get-performance-summary.tool.js";

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

describe("registerGetPerformanceSummaryTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetPerformanceSummaryTool(server, {
      getPerformanceSummary: mockUseCase as unknown as GetPerformanceSummaryUseCase,
    });
  });

  it("returns performance summary JSON on success without params", async () => {
    const summary = { totalReturn: 0.12, annualizedReturn: 0.08 };
    mockUseCase.execute.mockResolvedValue(summary);

    const handler = getHandler(server, "get_performance_summary");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    });
    expect(mockUseCase.execute).toHaveBeenCalledWith(undefined, undefined);
  });

  it("passes from/to dates to use-case when provided", async () => {
    mockUseCase.execute.mockResolvedValue({});

    const handler = getHandler(server, "get_performance_summary");
    await handler({ from: "2024-01-01", to: "2024-12-31" });

    expect(mockUseCase.execute).toHaveBeenCalledWith("2024-01-01", "2024-12-31");
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Performance data unavailable"));

    const handler = getHandler(server, "get_performance_summary");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: "Performance data unavailable" }],
      isError: true,
    });
  });
});

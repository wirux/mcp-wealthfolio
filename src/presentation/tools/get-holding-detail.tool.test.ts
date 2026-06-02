import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetHoldingDetailUseCase } from "../../use-cases/get-holding-detail.js";
import { registerGetHoldingDetailTool } from "./get-holding-detail.tool.js";

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

describe("registerGetHoldingDetailTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetHoldingDetailTool(server, {
      getHoldingDetail: mockUseCase as unknown as GetHoldingDetailUseCase,
    });
  });

  it("returns holding detail JSON on success", async () => {
    const holding = { symbol: "AAPL", quantity: 5 };
    mockUseCase.execute.mockResolvedValue(holding);

    const handler = getHandler(server, "get_holding_detail");
    const result = await handler({ account_id: "acc1", asset_id: "AAPL" });

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(holding, null, 2) }],
    });
    expect(mockUseCase.execute).toHaveBeenCalledWith("acc1", "AAPL");
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Holding not found"));

    const handler = getHandler(server, "get_holding_detail");
    const result = await handler({ account_id: "acc1", asset_id: "UNKNOWN" });

    expect(result).toEqual({
      content: [{ type: "text", text: "Holding not found" }],
      isError: true,
    });
  });
});

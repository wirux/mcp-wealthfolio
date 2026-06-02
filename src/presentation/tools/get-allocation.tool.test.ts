import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetAllocationUseCase } from "../../use-cases/get-allocation.js";
import { registerGetAllocationTool } from "./get-allocation.tool.js";

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

describe("registerGetAllocationTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetAllocationTool(server, {
      getAllocation: mockUseCase as unknown as GetAllocationUseCase,
    });
  });

  it("returns allocation JSON on success", async () => {
    const allocation = { byCurrency: { USD: 0.8, EUR: 0.2 } };
    mockUseCase.execute.mockResolvedValue(allocation);

    const handler = getHandler(server, "get_allocation");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(allocation, null, 2) }],
    });
    expect(mockUseCase.execute).toHaveBeenCalledWith(undefined);
  });

  it("passes account_id to use case", async () => {
    const allocation = { items: [] };
    mockUseCase.execute.mockResolvedValue(allocation);

    const handler = getHandler(server, "get_allocation");
    await handler({ account_id: "acc-1" });

    expect(mockUseCase.execute).toHaveBeenCalledWith("acc-1");
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Allocation unavailable"));

    const handler = getHandler(server, "get_allocation");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: "Allocation unavailable" }],
      isError: true,
    });
  });
});

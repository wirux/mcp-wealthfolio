import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetDividendsUseCase } from "../../use-cases/get-dividends.js";
import { registerGetDividendsTool } from "./get-dividends.tool.js";

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

describe("registerGetDividendsTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetDividendsTool(server, { getDividends: mockUseCase as unknown as GetDividendsUseCase });
  });

  it("returns JSON content with dividends on success", async () => {
    const result = { activities: [{ id: "d1", type: "DIVIDEND" }], total: 1 };
    mockUseCase.execute.mockResolvedValue(result);

    const handler = getHandler(server, "get_dividends");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Dividends error"));

    const handler = getHandler(server, "get_dividends");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: "Dividends error" }],
      isError: true,
    });
  });

  it("passes year filter to use-case", async () => {
    mockUseCase.execute.mockResolvedValue({ activities: [], total: 0 });

    const handler = getHandler(server, "get_dividends");
    await handler({ year: 2023 });

    const params = mockUseCase.execute.mock.calls[0]?.[0];
    expect(params?.year).toBe(2023);
  });

  it("registers the tool with readOnlyHint annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["get_dividends"]?.annotations?.readOnlyHint).toBe(true);
  });
});

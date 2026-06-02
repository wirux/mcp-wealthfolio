import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetHealthUseCase } from "../../use-cases/get-health.js";
import { registerGetHealthTool } from "./get-health.tool.js";

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

describe("registerGetHealthTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetHealthTool(server, { getHealth: mockUseCase as unknown as GetHealthUseCase });
  });

  it("returns JSON content with health status on success", async () => {
    const health = { healthy: true };
    mockUseCase.execute.mockResolvedValue(health);

    const handler = getHandler(server, "get_health");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: JSON.stringify(health, null, 2) }],
    });
  });

  it("returns unhealthy status as JSON (not isError)", async () => {
    const health = { healthy: false };
    mockUseCase.execute.mockResolvedValue(health);

    const handler = getHandler(server, "get_health");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: JSON.stringify(health, null, 2) }],
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Health check failed"));

    const handler = getHandler(server, "get_health");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: "Health check failed" }],
      isError: true,
    });
  });

  it("registers the tool with readOnlyHint annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["get_health"]?.annotations?.readOnlyHint).toBe(true);
  });
});

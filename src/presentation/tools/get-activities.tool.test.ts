import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetActivitiesUseCase } from "../../use-cases/get-activities.js";
import { registerGetActivitiesTool } from "./get-activities.tool.js";

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

describe("registerGetActivitiesTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerGetActivitiesTool(server, { getActivities: mockUseCase as unknown as GetActivitiesUseCase });
  });

  it("returns JSON content with activities on success", async () => {
    const result = { activities: [{ id: "a1", type: "BUY" }], total: 1 };
    mockUseCase.execute.mockResolvedValue(result);

    const handler = getHandler(server, "get_activities");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Search failed"));

    const handler = getHandler(server, "get_activities");
    const response = await handler({});

    expect(response).toEqual({
      content: [{ type: "text", text: "Search failed" }],
      isError: true,
    });
  });

  it("passes account_id filter to criteria", async () => {
    mockUseCase.execute.mockResolvedValue({ activities: [], total: 0 });

    const handler = getHandler(server, "get_activities");
    await handler({ account_id: "acc1" });

    const criteria = mockUseCase.execute.mock.calls[0]?.[0];
    expect(criteria?.accountIdFilter).toEqual(["acc1"]);
  });

  it("registers the tool with readOnlyHint annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["get_activities"]?.annotations?.readOnlyHint).toBe(true);
  });
});

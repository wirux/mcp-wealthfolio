import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ListAccountsUseCase } from "../../use-cases/list-accounts.js";
import { registerListAccountsTool } from "./list-accounts.tool.js";

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

describe("registerListAccountsTool", () => {
  let server: McpServer;
  let mockUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockUseCase = { execute: vi.fn() };
    registerListAccountsTool(server, { listAccounts: mockUseCase as unknown as ListAccountsUseCase });
  });

  it("returns JSON content with accounts on success", async () => {
    const accounts = [{ id: "acc1", name: "Main" }];
    mockUseCase.execute.mockResolvedValue(accounts);

    const handler = getHandler(server, "list_accounts");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(accounts, null, 2) }],
    });
  });

  it("returns isError response when use-case throws", async () => {
    mockUseCase.execute.mockRejectedValue(new Error("Gateway down"));

    const handler = getHandler(server, "list_accounts");
    const result = await handler({});

    expect(result).toEqual({
      content: [{ type: "text", text: "Gateway down" }],
      isError: true,
    });
  });

  it("registers the tool with readOnlyHint annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["list_accounts"]?.annotations?.readOnlyHint).toBe(true);
  });
});

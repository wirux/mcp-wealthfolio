import { describe, it, expect } from "vitest";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTransport } from "./index.js";
import { ValidationError } from "../../domain/errors/index.js";

function makeConfig(overrides: Record<string, unknown>) {
  return {
    wealthfolioUrl: "http://localhost:8088",
    wealthfolioPassword: "secret",
    logLevel: "info",
    port: 3000,
    mcpTransportType: "stdio",
    ...overrides,
  } as Parameters<typeof createTransport>[0];
}

describe("createTransport", () => {
  it("returns StdioServerTransport for stdio type", () => {
    const result = createTransport(makeConfig({ mcpTransportType: "stdio" }));
    expect(result.transport).toBeInstanceOf(StdioServerTransport);
    expect(result.kind).toBe("stdio");
  });

  it("returns StreamableHTTPServerTransport for http type", () => {
    const result = createTransport(makeConfig({ mcpTransportType: "http", port: 0 }));
    expect(result.transport).toBeInstanceOf(StreamableHTTPServerTransport);
    expect(result.kind).toBe("http");
    if (result.kind === "http") {
      expect(typeof result.listen).toBe("function");
      expect(typeof result.close).toBe("function");
    }
  });

  it("throws ValidationError for unknown transport type", () => {
    expect(() =>
      createTransport(makeConfig({ mcpTransportType: "websocket" as "stdio" })),
    ).toThrow(ValidationError);
  });
});

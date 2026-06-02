import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../../src/presentation/server.js";
import { createHttpTransport } from "../../src/presentation/transports/http.js";
import type { Logger } from "../../src/domain/ports/logger.js";
import type { AddressInfo } from "node:net";
import * as http from "node:http";

type ExecuteMock = ReturnType<typeof vi.fn>;

type MockUseCases = {
  listAccounts: { execute: ExecuteMock };
  getHoldings: { execute: ExecuteMock };
  getHoldingDetail: { execute: ExecuteMock };
  getAllocation: { execute: ExecuteMock };
  getPerformanceSummary: { execute: ExecuteMock };
  getPerformanceHistory: { execute: ExecuteMock };
  getActivities: { execute: ExecuteMock };
  getDividends: { execute: ExecuteMock };
  getNetWorth: { execute: ExecuteMock };
  getHealth: { execute: ExecuteMock };
  getExchangeRates: { execute: ExecuteMock };
  syncPrices: { execute: ExecuteMock };
  computeRebalancing: { execute: ExecuteMock };
};

const logger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

function createMockUseCases(): MockUseCases {
  return {
    listAccounts: { execute: vi.fn() },
    getHoldings: { execute: vi.fn() },
    getHoldingDetail: { execute: vi.fn() },
    getAllocation: { execute: vi.fn() },
    getPerformanceSummary: { execute: vi.fn() },
    getPerformanceHistory: { execute: vi.fn() },
    getActivities: { execute: vi.fn() },
    getDividends: { execute: vi.fn() },
    getNetWorth: { execute: vi.fn() },
    getHealth: { execute: vi.fn() },
    getExchangeRates: { execute: vi.fn() },
    syncPrices: { execute: vi.fn() },
    computeRebalancing: { execute: vi.fn() },
  };
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address() as AddressInfo;
      srv.close((err) => {
        if (err !== undefined) {
          reject(err);
        } else {
          resolve(addr.port);
        }
      });
    });
  });
}

function parseSseOrJson(raw: string): unknown {
  const dataLine = raw
    .split("\n")
    .find((line) => line.startsWith("data:"));
  if (dataLine !== undefined) {
    try {
      return JSON.parse(dataLine.slice("data:".length).trim());
    } catch {
      return raw;
    }
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function postJson(url: string, body: unknown): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsedUrl = new URL(url);
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: Number(parsedUrl.port),
        path: parsedUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Accept: "application/json, text/event-stream",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode ?? 0, body: parseSseOrJson(raw) });
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

describe("HTTP Transport E2E", () => {
  let mockUseCases: MockUseCases;
  let httpResult: ReturnType<typeof createHttpTransport>;
  let port: number;

  beforeEach(async () => {
    mockUseCases = createMockUseCases();
    port = await getFreePort();
    httpResult = createHttpTransport({ port });

    const mcpServer = createServer({
      config: { transportType: "http", httpPort: port },
      logger,
      useCases: mockUseCases as unknown as Parameters<typeof createServer>[0]["useCases"],
    });

    await httpResult.listen();
    await mcpServer.connect(httpResult.transport);
  });

  afterEach(async () => {
    await httpResult.close().catch(() => {});
  });

  it("starts HTTP server on a dynamic port and responds to MCP initialize", async () => {
    const response = await postJson(`http://127.0.0.1:${port}/mcp`, {
      jsonrpc: "2.0",
      method: "initialize",
      id: 1,
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "0.0.0" },
      },
    });

    expect(response.status).toBe(200);
    const body = response.body as Record<string, unknown>;
    expect(body).toHaveProperty("jsonrpc", "2.0");
    expect(body).toHaveProperty("id", 1);
    expect(body).toHaveProperty("result");
    const result = body["result"] as Record<string, unknown>;
    expect(result).toHaveProperty("serverInfo");
  });

  it("returns an error response for a malformed JSON-RPC request", async () => {
    const response = await postJson(`http://127.0.0.1:${port}/mcp`, {
      not: "a valid jsonrpc request",
    });

    const body = response.body as Record<string, unknown>;
    const isErrorStatus = response.status >= 400;
    const isJsonRpcError = typeof body === "object" && body !== null && "error" in body;

    expect(isErrorStatus || isJsonRpcError).toBe(true);
  });

  it("shuts down gracefully when close() is called", async () => {
    await expect(httpResult.close()).resolves.toBeUndefined();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WealthfolioClient } from "../../src/infrastructure/wealthfolio/client.js";
import { ApiError } from "../../src/domain/errors/api-error.js";
import { ValidationError } from "../../src/domain/errors/validation-error.js";
import type { AuthManager } from "../../src/infrastructure/wealthfolio/auth-manager.js";

const mockAuthManager = {
  refreshIfNeeded: vi.fn().mockResolvedValue(undefined),
  getCookie: vi.fn().mockReturnValue("session=abc"),
  login: vi.fn().mockResolvedValue(undefined),
} as unknown as AuthManager;

describe("WealthfolioClient - Content-Type handling (Bug 1)", () => {
  let client: WealthfolioClient;

  beforeEach(() => {
    client = new WealthfolioClient("http://127.0.0.1:8088", mockAuthManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses JSON response with application/json content-type", async () => {
    const body = { foo: "bar" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await client.get<{ foo: string }>("/api/v1/test");
    expect(result).toEqual(body);
  });

  it("parses JSON response with text/plain content-type", async () => {
    const body = [{ id: "1", name: "Test" }];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }),
    );

    const result = await client.get<unknown[]>("/api/v1/test");
    expect(result).toEqual(body);
  });

  it("parses JSON response with no content-type header", async () => {
    const body = { data: 42 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200 }),
    );

    const result = await client.get<{ data: number }>("/api/v1/test");
    expect(result).toEqual(body);
  });

  it("throws ApiError when response body is not valid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("This is plain text, not JSON", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    await expect(client.get("/api/v1/test")).rejects.toThrow(ApiError);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("This is plain text, not JSON", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    await expect(client.get("/api/v1/test")).rejects.toThrow(/not valid JSON/);
  });
});

describe("WealthfolioClient - assertReadOnly", () => {
  let client: WealthfolioClient;

  beforeEach(() => {
    client = new WealthfolioClient("http://127.0.0.1:8088", mockAuthManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows POST to /api/v1/market-data/sync", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const result = await client.post<undefined>("/api/v1/market-data/sync", { refetchAll: false });
    expect(result).toBeUndefined();
  });

  it("rejects POST to non-whitelisted path", async () => {
    await expect(
      client.post("/api/v1/accounts", { name: "new" }),
    ).rejects.toThrow(ValidationError);
  });

  it("handles 204 No Content response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const result = await client.post<undefined>("/api/v1/market-data/sync", { refetchAll: false });
    expect(result).toBeUndefined();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../domain/errors/api-error.js";
import { ResponseTooLargeError } from "../../domain/errors/response-too-large.error.js";
import { AuthManager } from "./auth-manager.js";
import { WealthfolioClient } from "./client.js";

type MockAuthManager = {
  refreshIfNeeded: ReturnType<typeof vi.fn<() => Promise<void>>>;
  getCookie: ReturnType<typeof vi.fn<() => string>>;
  login: ReturnType<typeof vi.fn<() => Promise<void>>>;
};

type MockResponseOptions = {
  ok: boolean;
  status: number;
  json?: unknown;
  text?: string;
  contentType?: string;
  contentLength?: number;
};

function createAuthManager(): MockAuthManager {
  return {
    refreshIfNeeded: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    getCookie: vi.fn<() => string>().mockReturnValue("session=abc123"),
    login: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
}

function createResponse(options: MockResponseOptions): Response {
  const textBody = options.text ?? (options.json !== undefined ? JSON.stringify(options.json) : "");
  return {
    ok: options.ok,
    status: options.status,
    json: vi.fn().mockResolvedValue(options.json),
    text: vi.fn().mockResolvedValue(textBody),
    headers: {
      get: vi.fn((name: string) => {
        if (name.toLowerCase() === "content-type") {
          return options.contentType ?? "application/json";
        }

        if (name.toLowerCase() === "content-length") {
          return options.contentLength !== undefined ? String(options.contentLength) : null;
        }

        return null;
      }),
    },
  } as unknown as Response;
}

describe("WealthfolioClient", () => {
  const baseUrl = "https://wealthfolio.example";
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("GET request injects cookie and uses GET method", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock.mockResolvedValue(
      createResponse({ ok: true, status: 200, json: { items: ["a"] } }),
    );

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.get<{ items: string[] }>("/api/v1/accounts")).resolves.toEqual({
      items: ["a"],
    });

    expect(mockAuthManager.refreshIfNeeded).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("https://wealthfolio.example/api/v1/accounts", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: "session=abc123",
      },
      body: undefined,
      signal: expect.any(AbortSignal),
    });
  });

  it("POST to /activities/search is allowed", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock.mockResolvedValue(createResponse({ ok: true, status: 200, json: { total: 1 } }));

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(
      client.post<{ total: number }>("/api/v1/activities/search", { q: "dividend" }),
    ).resolves.toEqual({ total: 1 });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("POST to non-allowlisted path throws ValidationError", async () => {
    const mockAuthManager = createAuthManager();
    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.post("/api/v1/accounts", { name: "Brokerage" })).rejects.toThrow(
      "Method POST not allowed on path /api/v1/accounts",
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockAuthManager.refreshIfNeeded).not.toHaveBeenCalled();
  });

  it("PUT requests are blocked by read-only guard", async () => {
    const mockAuthManager = createAuthManager();
    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(
      (client as unknown as {
        request: (
          method: string,
          path: string,
          body?: unknown,
          params?: Record<string, string>,
        ) => Promise<unknown>;
      }).request("PUT", "/api/v1/accounts/1"),
    ).rejects.toThrow("Method PUT not allowed on path /api/v1/accounts/1");
  });

  it("401 response re-auths once and retries", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock
      .mockResolvedValueOnce(createResponse({ ok: false, status: 401, text: "unauthorized" }))
      .mockResolvedValueOnce(createResponse({ ok: true, status: 200, json: { ok: true } }));

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.get<{ ok: boolean }>("/api/v1/holdings")).resolves.toEqual({ ok: true });

    expect(mockAuthManager.login).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("5xx response throws ApiError", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock.mockResolvedValue(
      createResponse({ ok: false, status: 500, text: "server exploded" }),
    );

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.get("/api/v1/accounts")).rejects.toBeInstanceOf(ApiError);
    await expect(client.get("/api/v1/accounts")).rejects.toThrow("HTTP 500");
  });

  it("non-JSON response throws ApiError", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock.mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        text: "<html></html>",
        contentType: "text/html",
      }),
    );

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.get("/api/v1/healthz")).rejects.toBeInstanceOf(ApiError);
    await expect(client.get("/api/v1/healthz")).rejects.toThrow("not valid JSON");
  });

  it("timeout abort throws ConnectionError with timeout code", async () => {
    vi.useFakeTimers();

    const mockAuthManager = createAuthManager();
    fetchMock.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const abortError = new Error("aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        }),
    );

    const client = new WealthfolioClient(
      baseUrl,
      mockAuthManager as unknown as AuthManager,
      25,
    );

    const request = client.get("/api/v1/accounts");
    const assertion = expect(request).rejects.toMatchObject({
      code: "CONNECTION_TIMEOUT",
      message: "Request timed out",
    });

    await vi.advanceTimersByTimeAsync(25);
    await assertion;
  });

  it("network errors throw ConnectionError", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.get("/api/v1/accounts")).rejects.toMatchObject({
      code: "CONNECTION_FAILED",
      message: "Network error: TypeError: fetch failed",
    });
  });

  it("throws ResponseTooLargeError when Content-Length exceeds 10MB", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock.mockResolvedValue(
      createResponse({ ok: true, status: 200, json: {}, contentLength: 10485761 }),
    );

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.get("/api/v1/accounts")).rejects.toBeInstanceOf(ResponseTooLargeError);
    await expect(client.get("/api/v1/accounts")).rejects.toThrow("Response too large: 10485761 bytes");
  });

  it("passes through response with small Content-Length", async () => {
    const mockAuthManager = createAuthManager();
    fetchMock.mockResolvedValue(
      createResponse({ ok: true, status: 200, json: { ok: true }, contentLength: 100 }),
    );

    const client = new WealthfolioClient(baseUrl, mockAuthManager as unknown as AuthManager);

    await expect(client.get<{ ok: boolean }>("/api/v1/accounts")).resolves.toEqual({ ok: true });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "../../domain/errors/authentication-error.js";
import { ConnectionError } from "../../domain/errors/connection-error.js";
import { AuthManager } from "./auth-manager.js";

type MockResponseOptions = {
  ok: boolean;
  status: number;
  json: unknown;
  setCookie?: string;
};

function createResponse(options: MockResponseOptions): Response {
  return {
    ok: options.ok,
    status: options.status,
    json: vi.fn().mockResolvedValue(options.json),
    headers: {
      get: vi.fn((name: string) => {
        if (name.toLowerCase() === "set-cookie") {
          return options.setCookie ?? null;
        }

        return null;
      }),
    },
  } as unknown as Response;
}

describe("AuthManager", () => {
  const baseUrl = "https://wealthfolio.example";
  const password = "secret-password";
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("login() stores cookie from Set-Cookie header", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        json: { authenticated: true, expiresIn: 120 },
        setCookie: "wealthfolio_session=abc123; HttpOnly; Path=/",
      }),
    );

    const manager = new AuthManager(baseUrl, password);
    await manager.login();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(manager.getCookie()).toBe("wealthfolio_session=abc123");
  });

  it("getCookie() before login throws AuthenticationError", () => {
    const manager = new AuthManager(baseUrl, password);

    expect(() => manager.getCookie()).toThrow(AuthenticationError);
    expect(() => manager.getCookie()).toThrow("Not authenticated. Call login() first.");
  });

  it("isExpired() flips around half of TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    fetchMock.mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        json: { authenticated: true, expiresIn: 100 },
        setCookie: "wealthfolio_session=abc123; HttpOnly; Path=/",
      }),
    );

    const manager = new AuthManager(baseUrl, password);
    await manager.login();

    vi.setSystemTime(new Date("2026-01-01T00:00:49.000Z"));
    expect(manager.isExpired()).toBe(false);

    vi.setSystemTime(new Date("2026-01-01T00:00:51.000Z"));
    expect(manager.isExpired()).toBe(true);
  });

  it("refreshIfNeeded() when expired calls login", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          ok: true,
          status: 200,
          json: { authenticated: true, expiresIn: 100 },
          setCookie: "wealthfolio_session=first; HttpOnly; Path=/",
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          ok: true,
          status: 200,
          json: { authenticated: true, expiresIn: 100 },
          setCookie: "wealthfolio_session=refreshed; HttpOnly; Path=/",
        }),
      );

    const manager = new AuthManager(baseUrl, password);
    await manager.login();

    vi.setSystemTime(new Date("2026-01-01T00:00:51.000Z"));
    await manager.refreshIfNeeded();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(manager.getCookie()).toBe("wealthfolio_session=refreshed");
  });

  it("two concurrent refreshIfNeeded() calls share one login fetch", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    let resolveRefresh: ((value: Response) => void) | undefined;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          ok: true,
          status: 200,
          json: { authenticated: true, expiresIn: 100 },
          setCookie: "wealthfolio_session=first; HttpOnly; Path=/",
        }),
      )
      .mockReturnValueOnce(refreshResponse);

    const manager = new AuthManager(baseUrl, password);
    await manager.login();

    vi.setSystemTime(new Date("2026-01-01T00:00:51.000Z"));

    const firstRefresh = manager.refreshIfNeeded();
    const secondRefresh = manager.refreshIfNeeded();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    resolveRefresh?.(
      createResponse({
        ok: true,
        status: 200,
        json: { authenticated: true, expiresIn: 100 },
        setCookie: "wealthfolio_session=shared; HttpOnly; Path=/",
      }),
    );

    await Promise.all([firstRefresh, secondRefresh]);
    expect(manager.getCookie()).toBe("wealthfolio_session=shared");
  });

  it("login with 401 response throws AuthenticationError", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        ok: false,
        status: 401,
        json: { authenticated: false, expiresIn: 0 },
      }),
    );

    const manager = new AuthManager(baseUrl, password);

    await expect(manager.login()).rejects.toBeInstanceOf(AuthenticationError);
    await expect(manager.login()).rejects.toThrow("Login failed: 401");
  });

  it("network error during login throws ConnectionError", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const manager = new AuthManager(baseUrl, password);

    await expect(manager.login()).rejects.toBeInstanceOf(ConnectionError);
    await expect(manager.login()).rejects.toThrow("Network error: TypeError: fetch failed");
  });

  it("empty Set-Cookie header throws AuthenticationError", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        json: { authenticated: true, expiresIn: 120 },
        setCookie: undefined,
      }),
    );

    const manager = new AuthManager(baseUrl, password);

    await expect(manager.login()).rejects.toBeInstanceOf(AuthenticationError);
    await expect(manager.login()).rejects.toThrow("No session cookie received");
  });

  it("malformed cookie without '=' sign throws AuthenticationError", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        json: { authenticated: true, expiresIn: 120 },
        setCookie: "wealthfolio_session_no_equals; HttpOnly; Path=/",
      }),
    );

    const manager = new AuthManager(baseUrl, password);

    await expect(manager.login()).rejects.toBeInstanceOf(AuthenticationError);
    await expect(manager.login()).rejects.toThrow("Invalid cookie format");
  });

  it("cookie with spaces around name and value is trimmed and stored correctly", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        json: { authenticated: true, expiresIn: 120 },
        setCookie: "  wealthfolio_session  =  abc123  ; HttpOnly; Path=/",
      }),
    );

    const manager = new AuthManager(baseUrl, password);
    await manager.login();

    expect(manager.getCookie()).toBe("wealthfolio_session=abc123");
  });

  it("AbortController timeout throws ConnectionError", async () => {
    vi.useFakeTimers();

    fetchMock.mockImplementation(
      (_url: string, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = options?.signal;
          if (signal) {
            signal.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          }
        }),
    );

    const manager = new AuthManager(baseUrl, password);
    const loginPromise = manager.login();
    const assertion = expect(loginPromise).rejects.toBeInstanceOf(ConnectionError);

    await vi.advanceTimersByTimeAsync(10_001);
    await assertion;
  });

  it("concurrent login() calls share one fetch via mutex", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    let resolveRefresh: ((value: Response) => void) | undefined;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });

    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          ok: true,
          status: 200,
          json: { authenticated: true, expiresIn: 100 },
          setCookie: "wealthfolio_session=first; HttpOnly; Path=/",
        }),
      )
      .mockReturnValueOnce(refreshResponse);

    const manager = new AuthManager(baseUrl, password);
    await manager.login();

    vi.setSystemTime(new Date("2026-01-01T00:00:51.000Z"));

    const first = manager.refreshIfNeeded();
    const second = manager.refreshIfNeeded();
    const third = manager.refreshIfNeeded();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    resolveRefresh?.(
      createResponse({
        ok: true,
        status: 200,
        json: { authenticated: true, expiresIn: 100 },
        setCookie: "wealthfolio_session=shared; HttpOnly; Path=/",
      }),
    );

    await Promise.all([first, second, third]);
    expect(manager.getCookie()).toBe("wealthfolio_session=shared");
  });
});

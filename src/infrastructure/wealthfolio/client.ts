import { ApiError } from "../../domain/errors/api-error.js";
import { AuthenticationError } from "../../domain/errors/authentication-error.js";
import { ConnectionError } from "../../domain/errors/connection-error.js";
import { ResponseTooLargeError } from "../../domain/errors/response-too-large.error.js";
import { ValidationError } from "../../domain/errors/validation-error.js";
import { AuthManager } from "./auth-manager.js";

export class WealthfolioClient {
  constructor(
    private readonly baseUrl: string,
    private readonly authManager: AuthManager,
    private readonly timeoutMs: number = 30_000,
  ) {}

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
    hasRetried = false,
  ): Promise<T> {
    this.assertReadOnly(method, path);

    await this.authManager.refreshIfNeeded();

    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const requestInit: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Cookie: this.authManager.getCookie(),
        },
        signal: controller.signal,
      };

      if (body !== undefined) {
        requestInit.body = JSON.stringify(body);
      }

      const response = await fetch(url.toString(), requestInit);

      clearTimeout(timeout);

      if (response.status === 401) {
        if (hasRetried) {
          throw new AuthenticationError("Authentication failed after retry");
        }

        await this.authManager.login();
        return this.request<T>(method, path, body, params, true);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ApiError(`HTTP ${response.status}`, response.status, errorBody);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const MAX_SIZE = 10 * 1024 * 1024;
      const len = parseInt(response.headers.get("content-length") ?? "0", 10);
      if (len > MAX_SIZE) throw new ResponseTooLargeError(`Response too large: ${len} bytes`);

      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        const contentType = response.headers.get("content-type") ?? "";
        throw new ApiError(
          `Response is not valid JSON (content-type: ${contentType})`,
          response.status,
          text,
        );
      }
    } catch (err) {
      clearTimeout(timeout);

      if (
        err instanceof ApiError ||
        err instanceof ValidationError ||
        err instanceof AuthenticationError ||
        err instanceof ResponseTooLargeError
      ) {
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        throw new ConnectionError("Request timed out", "CONNECTION_TIMEOUT");
      }

      throw new ConnectionError(`Network error: ${String(err)}`);
    }
  }

  private assertReadOnly(method: string, path: string): void {
    if (method === "GET") {
      return;
    }

    if (method === "POST") {
      if (
        path.includes("/activities/search") ||
        path.startsWith("/api/v1/auth/") ||
        path.includes("/performance/summary") ||
        path.includes("/performance/history") ||
        path.includes("/market-data/sync")
      ) {
        return;
      }
    }

    throw new ValidationError(`Method ${method} not allowed on path ${path}`);
  }
}

import { AuthenticationError } from "../../domain/errors/authentication-error.js";
import { ConnectionError } from "../../domain/errors/connection-error.js";

type LoginResponse = {
  authenticated: boolean;
  expiresIn: number;
};

export class AuthManager {
  private cookie: string | undefined = undefined;
  private loginTime: number | undefined = undefined;
  private expiresIn: number | undefined = undefined;
  private refreshPromise: Promise<void> | undefined = undefined;

  constructor(
    private readonly baseUrl: string,
    private readonly password: string,
  ) {}

  async login(): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, 10_000);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: this.password }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AuthenticationError(`Login failed: ${response.status}`);
      }

      const data = (await response.json()) as LoginResponse;
      if (!data.authenticated) {
        throw new AuthenticationError("Authentication rejected by server");
      }

      const setCookie = response.headers.get("set-cookie");
      if (!setCookie) {
        throw new AuthenticationError("No session cookie received");
      }

      const cookieValue = setCookie.split(";")[0]?.trim() ?? "";
      const eqIndex = cookieValue.indexOf("=");
      if (eqIndex <= 0) {
        throw new AuthenticationError("Invalid cookie format");
      }
      const cookieName = cookieValue.slice(0, eqIndex).trim();
      const cookieVal = cookieValue.slice(eqIndex + 1).trim();
      if (!cookieName || !cookieVal) {
        throw new AuthenticationError("Invalid cookie format");
      }

      this.cookie = `${cookieName}=${cookieVal}`;
      this.loginTime = Date.now();
      this.expiresIn = data.expiresIn;
    } catch (err) {
      if (err instanceof AuthenticationError) {
        throw err;
      }

      throw new ConnectionError(`Network error: ${String(err)}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getCookie(): string {
    if (!this.cookie) {
      throw new AuthenticationError("Not authenticated. Call login() first.");
    }

    return this.cookie;
  }

  isExpired(): boolean {
    if (this.loginTime === undefined || this.expiresIn === undefined) {
      return true;
    }

    const halfTtlMs = this.expiresIn * 0.5 * 1000;
    return Date.now() >= this.loginTime + halfTtlMs;
  }

  async refreshIfNeeded(): Promise<void> {
    if (!this.isExpired()) {
      return;
    }

    if (this.refreshPromise !== undefined) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.login().finally(() => {
      this.refreshPromise = undefined;
    });

    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    if (!this.cookie) {
      return;
    }

    await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: this.cookie },
    });

    this.cookie = undefined;
    this.loginTime = undefined;
    this.expiresIn = undefined;
  }
}

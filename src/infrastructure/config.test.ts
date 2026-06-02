import { writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
    for (const key of [
      "WEALTHFOLIO_URL",
      "WEALTHFOLIO_PASSWORD",
      "WEALTHFOLIO_PASSWORD_FILE",
      "WEALTHFOLIO_ALLOW_INSECURE",
      "MCP_TRANSPORT_TYPE",
      "PORT",
      "LOG_LEVEL",
    ]) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  it("returns all defaults when no env vars are set", () => {
    const config = loadConfig();
    expect(config.wealthfolioUrl).toBe("http://127.0.0.1:8088");
    expect(config.wealthfolioAllowInsecure).toBe(false);
    expect(config.mcpTransportType).toBe("stdio");
    expect(config.port).toBe(3000);
    expect(config.logLevel).toBe("info");
    expect(config.wealthfolioPassword).toBeUndefined();
    expect(config.wealthfolioPasswordFile).toBeUndefined();
  });

  it("stores custom URL correctly", () => {
    process.env["WEALTHFOLIO_URL"] = "https://my-host:9000";
    const config = loadConfig();
    expect(config.wealthfolioUrl).toBe("https://my-host:9000");
  });

  it("throws for http to external host without ALLOW_INSECURE", () => {
    process.env["WEALTHFOLIO_URL"] = "http://external-host:8088";
    expect(() => loadConfig()).toThrow("Insecure URL requires WEALTHFOLIO_ALLOW_INSECURE=true");
  });

  it("passes for http://127.0.0.1 without ALLOW_INSECURE (loopback)", () => {
    process.env["WEALTHFOLIO_URL"] = "http://127.0.0.1:8088";
    expect(() => loadConfig()).not.toThrow();
  });

  it("passes for http://localhost without ALLOW_INSECURE (loopback)", () => {
    process.env["WEALTHFOLIO_URL"] = "http://localhost:8088";
    expect(() => loadConfig()).not.toThrow();
  });

  it("passes for https://external-host without ALLOW_INSECURE (https is fine)", () => {
    process.env["WEALTHFOLIO_URL"] = "https://external-host:8088";
    expect(() => loadConfig()).not.toThrow();
  });

  it("file content wins over WEALTHFOLIO_PASSWORD when both are set", () => {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    const filePath = join(dir, "password.txt");
    writeFileSync(filePath, "  file-secret  \n");
    process.env["WEALTHFOLIO_PASSWORD"] = "env-secret";
    process.env["WEALTHFOLIO_PASSWORD_FILE"] = filePath;
    const config = loadConfig();
    expect(config.wealthfolioPassword).toBe("file-secret");
  });

  it("reads password from file when only WEALTHFOLIO_PASSWORD_FILE is set", () => {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    const filePath = join(dir, "password.txt");
    writeFileSync(filePath, "secret-from-file");
    process.env["WEALTHFOLIO_PASSWORD_FILE"] = filePath;
    const config = loadConfig();
    expect(config.wealthfolioPassword).toBe("secret-from-file");
  });

  it("throws a descriptive error when WEALTHFOLIO_PASSWORD_FILE does not exist", () => {
    process.env["WEALTHFOLIO_PASSWORD_FILE"] = "/nonexistent/path/to/password.txt";
    expect(() => loadConfig()).toThrow(
      'WEALTHFOLIO_PASSWORD_FILE could not be read at path "/nonexistent/path/to/password.txt"',
    );
  });

  it("throws when WEALTHFOLIO_PASSWORD_FILE contains path traversal (../)", () => {
    process.env["WEALTHFOLIO_PASSWORD_FILE"] = "/some/safe/../../../etc/passwd";
    expect(() => loadConfig()).toThrow(
      "WEALTHFOLIO_PASSWORD_FILE path must not contain path traversal sequences (../)",
    );
  });

  it("reads password successfully from a readable file (happy path)", () => {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    const filePath = join(dir, "pw.txt");
    writeFileSync(filePath, "  my-password  \n");
    process.env["WEALTHFOLIO_PASSWORD_FILE"] = filePath;
    const config = loadConfig();
    expect(config.wealthfolioPassword).toBe("my-password");
  });
});

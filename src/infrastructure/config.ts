import { readFileSync } from "fs";
import { z } from "zod";

const configSchema = z.object({
  wealthfolioUrl: z.string().url().default("http://127.0.0.1:8088"),
  wealthfolioPassword: z.string().optional(),
  wealthfolioPasswordFile: z.string().optional(),
  wealthfolioAllowInsecure: z.boolean().default(false),
  mcpTransportType: z.enum(["stdio", "http"]).default("stdio"),
  port: z.number().int().positive().default(3000),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof configSchema>;

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export function loadConfig(): Config {
  const raw: {
    wealthfolioUrl?: string;
    wealthfolioPassword?: string;
    wealthfolioPasswordFile?: string;
    wealthfolioAllowInsecure?: boolean;
    mcpTransportType?: string;
    port?: number;
    logLevel?: string;
  } = {};

  if (process.env["WEALTHFOLIO_URL"] !== undefined) {
    raw.wealthfolioUrl = process.env["WEALTHFOLIO_URL"];
  }
  if (process.env["WEALTHFOLIO_PASSWORD"] !== undefined) {
    raw.wealthfolioPassword = process.env["WEALTHFOLIO_PASSWORD"];
  }
  if (process.env["WEALTHFOLIO_PASSWORD_FILE"] !== undefined) {
    raw.wealthfolioPasswordFile = process.env["WEALTHFOLIO_PASSWORD_FILE"];
  }
  if (process.env["WEALTHFOLIO_ALLOW_INSECURE"] !== undefined) {
    raw.wealthfolioAllowInsecure = process.env["WEALTHFOLIO_ALLOW_INSECURE"] === "true";
  }
  if (process.env["MCP_TRANSPORT_TYPE"] !== undefined) {
    raw.mcpTransportType = process.env["MCP_TRANSPORT_TYPE"];
  }
  if (process.env["PORT"] !== undefined) {
    raw.port = Number(process.env["PORT"]);
  }
  if (process.env["LOG_LEVEL"] !== undefined) {
    raw.logLevel = process.env["LOG_LEVEL"];
  }

  const config = configSchema.parse(raw);

  // Password file takes precedence over password
  if (config.wealthfolioPasswordFile !== undefined) {
    const filePath = config.wealthfolioPasswordFile;
    if (filePath.includes("../")) {
      throw new Error(
        `WEALTHFOLIO_PASSWORD_FILE path must not contain path traversal sequences (../): ${filePath}`,
      );
    }
    let fileContent: string;
    try {
      fileContent = readFileSync(filePath, "utf-8").trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `WEALTHFOLIO_PASSWORD_FILE could not be read at path "${filePath}": ${message}`,
      );
    }
    (config as { wealthfolioPassword?: string }).wealthfolioPassword = fileContent;
  }

  // Security check: http to non-loopback without ALLOW_INSECURE
  const url = new URL(config.wealthfolioUrl);
  if (
    url.protocol === "http:" &&
    !LOOPBACK_HOSTS.has(url.hostname) &&
    !config.wealthfolioAllowInsecure
  ) {
    throw new Error("Insecure URL requires WEALTHFOLIO_ALLOW_INSECURE=true");
  }

  return config;
}

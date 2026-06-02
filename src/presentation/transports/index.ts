import { ValidationError } from "../../domain/errors/index.js";
import { createStdioTransport } from "./stdio.js";
import { createHttpTransport, type HttpTransportResult } from "./http.js";
import type { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export type { HttpTransportResult } from "./http.js";

export interface TransportConfig {
  mcpTransportType: "stdio" | "http";
  port?: number;
}

export type TransportResult =
  | { kind: "stdio"; transport: StdioServerTransport }
  | { kind: "http"; transport: HttpTransportResult["transport"]; listen(): Promise<void>; close(): Promise<void> };

export function createTransport(config: TransportConfig): TransportResult {
  if (config.mcpTransportType === "stdio") {
    return { kind: "stdio", transport: createStdioTransport() };
  }

  if (config.mcpTransportType === "http") {
    const result = createHttpTransport({ port: config.port ?? 3000 });
    return {
      kind: "http",
      transport: result.transport,
      listen: result.listen.bind(result),
      close: result.close.bind(result),
    };
  }

  throw new ValidationError(
    `Unsupported MCP transport type: ${String(config.mcpTransportType)}`,
  );
}

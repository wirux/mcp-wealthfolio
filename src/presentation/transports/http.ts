import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export interface HttpTransportOptions {
  port: number;
}

export interface HttpTransportResult {
  transport: StreamableHTTPServerTransport;
  listen(): Promise<void>;
  close(): Promise<void>;
}

export function createHttpTransport(options: HttpTransportOptions): HttpTransportResult {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  const server = createServer((req, res) => {
    transport.handleRequest(req, res).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
    });
  });

  return {
    transport,
    listen(): Promise<void> {
      return new Promise((resolve) => {
        server.listen(options.port, () => {
          resolve();
        });
      });
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err !== undefined) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  };
}

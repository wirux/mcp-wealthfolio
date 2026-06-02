import { describe, expect, it } from "vitest";
import type { Logger } from "../domain/ports/logger.js";
import { createServer, getServerMetadata, type ServerContext } from "./server.js";

const logger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

describe("createServer", () => {
  it("creates without error when given valid config", () => {
    expect(() => createServer(createContext())).not.toThrow();
  });

  it("returns a truthy server instance", () => {
    const server = createServer(createContext());

    expect(server).toBeTruthy();
  });

  it("uses package name and version as server metadata", () => {
    const server = createServer(createContext());
    const metadata = getServerMetadata();
    const serverInfo = Reflect.get(server.server, "_serverInfo");

    expect(serverInfo).toMatchObject({
      name: metadata.name,
      version: metadata.version,
    });
  });
});

function createContext(): ServerContext {
  return {
    config: {
      transportType: "stdio",
      httpPort: 3000,
    },
    logger,
    useCases: {
      getHealth: {
        execute: async () => ({ healthy: true }),
      },
    },
  };
}

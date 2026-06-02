#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Logger } from "./domain/ports/logger.js";
import type { Config } from "./infrastructure/config.js";
import { loadConfig } from "./infrastructure/config.js";
import { ConsoleLogger } from "./infrastructure/logger.js";
import { AuthManager } from "./infrastructure/wealthfolio/auth-manager.js";
import { WealthfolioClient } from "./infrastructure/wealthfolio/client.js";
import { WealthfolioGatewayAdapter } from "./infrastructure/wealthfolio/gateway.js";
import { createServer, type ServerUseCases } from "./presentation/server.js";
import { createTransport, type TransportResult } from "./presentation/transports/index.js";
import {
  ComputeRebalancingUseCase,
  GetActivitiesUseCase,
  GetAllocationUseCase,
  GetDividendsUseCase,
  GetExchangeRatesUseCase,
  GetHealthUseCase,
  GetHoldingDetailUseCase,
  GetHoldingsUseCase,
  GetNetWorthUseCase,
  GetPerformanceHistoryUseCase,
  GetPerformanceSummaryUseCase,
  ListAccountsUseCase,
  SyncPricesUseCase,
} from "./use-cases/index.js";

export interface Application {
  config: Config;
  logger: Logger;
  server: McpServer;
  transportResult: TransportResult;
  useCases: ServerUseCases;
}

export function createApplication(): Application {
  const config = loadConfig();
  const logger = new ConsoleLogger(config.logLevel);
  const password = getWealthfolioPassword(config);
  const authManager = new AuthManager(config.wealthfolioUrl, password);
  const client = new WealthfolioClient(config.wealthfolioUrl, authManager);
  const gateway = new WealthfolioGatewayAdapter(client);
  const useCases: ServerUseCases = {
    listAccounts: new ListAccountsUseCase(gateway),
    getHoldings: new GetHoldingsUseCase(gateway),
    getHoldingDetail: new GetHoldingDetailUseCase(gateway),
    getAllocation: new GetAllocationUseCase(gateway),
    getPerformanceSummary: new GetPerformanceSummaryUseCase(gateway),
    getPerformanceHistory: new GetPerformanceHistoryUseCase(gateway),
    getActivities: new GetActivitiesUseCase(gateway),
    getDividends: new GetDividendsUseCase(gateway),
    getNetWorth: new GetNetWorthUseCase(gateway),
    getExchangeRates: new GetExchangeRatesUseCase(gateway),
    syncPrices: new SyncPricesUseCase(gateway),
    getHealth: new GetHealthUseCase(gateway),
    computeRebalancing: new ComputeRebalancingUseCase(),
  };
  const server = createServer({
    config: {
      transportType: config.mcpTransportType,
      httpPort: config.port,
    },
    logger,
    useCases,
  });

  const transportResult = createTransport({
    mcpTransportType: config.mcpTransportType,
    port: config.port,
  });

  return {
    config,
    logger,
    server,
    transportResult,
    useCases,
  };
}

export async function main(): Promise<void> {
  const application = createApplication();
  const healthStatus = await application.useCases.getHealth.execute();

  if (!healthStatus.healthy) {
    application.logger.warn("Wealthfolio health check failed during startup");
  }

  const { transportResult, server } = application;

  if (transportResult.kind === "stdio") {
    await server.connect(transportResult.transport);
  } else {
    await transportResult.listen();
    await server.connect(transportResult.transport as unknown as Transport);

    const shutdown = async (): Promise<void> => {
      await transportResult.close();
      process.exit(0);
    };

    process.on("SIGTERM", () => void shutdown());
    process.on("SIGINT", () => void shutdown());
  }
}

function getWealthfolioPassword(config: Config): string {
  if (config.wealthfolioPassword === undefined) {
    throw new Error("WEALTHFOLIO_PASSWORD or WEALTHFOLIO_PASSWORD_FILE is required");
  }

  return config.wealthfolioPassword;
}

const isMainModule =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  await main();
}

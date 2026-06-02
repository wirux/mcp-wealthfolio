import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "../domain/ports/logger.js";
import type { ListAccountsUseCase } from "../use-cases/list-accounts.js";
import type { GetHoldingsUseCase } from "../use-cases/get-holdings.js";
import type { GetHoldingDetailUseCase } from "../use-cases/get-holding-detail.js";
import type { GetAllocationUseCase } from "../use-cases/get-allocation.js";
import type { GetPerformanceSummaryUseCase } from "../use-cases/get-performance-summary.js";
import type { GetPerformanceHistoryUseCase } from "../use-cases/get-performance-history.js";
import type { GetActivitiesUseCase } from "../use-cases/get-activities.js";
import type { GetDividendsUseCase } from "../use-cases/get-dividends.js";
import type { GetNetWorthUseCase } from "../use-cases/get-net-worth.js";
import type { GetHealthUseCase } from "../use-cases/get-health.js";
import type { GetExchangeRatesUseCase } from "../use-cases/get-exchange-rates.js";
import type { ComputeRebalancingUseCase } from "../use-cases/compute-rebalancing.js";
import type { SyncPricesUseCase } from "../use-cases/sync-prices.js";
import { registerAllQueryTools, registerAllSpecializedTools } from "./tools/index.js";

type PackageMetadata = {
  name: string;
  version: string;
};

export interface ServerConfig {
  transportType: "stdio" | "http";
  httpPort: number;
}

export interface ServerContext {
  config: ServerConfig;
  logger: Logger;
  useCases: ServerUseCases;
}

export interface ServerUseCases {
  listAccounts: ListAccountsUseCase;
  getHoldings: GetHoldingsUseCase;
  getHoldingDetail: GetHoldingDetailUseCase;
  getAllocation: GetAllocationUseCase;
  getPerformanceSummary: GetPerformanceSummaryUseCase;
  getPerformanceHistory: GetPerformanceHistoryUseCase;
  getActivities: GetActivitiesUseCase;
  getDividends: GetDividendsUseCase;
  getNetWorth: GetNetWorthUseCase;
  getHealth: GetHealthUseCase;
  getExchangeRates: GetExchangeRatesUseCase;
  syncPrices: SyncPricesUseCase;
  computeRebalancing: ComputeRebalancingUseCase;
}

const PACKAGE_METADATA = loadPackageMetadata();

export function createServer(context: ServerContext): McpServer {
  const server = new McpServer({
    name: PACKAGE_METADATA.name,
    version: PACKAGE_METADATA.version,
  });

  registerAllQueryTools(server, {
    listAccounts: context.useCases.listAccounts,
    getHoldings: context.useCases.getHoldings,
    getHoldingDetail: context.useCases.getHoldingDetail,
    getAllocation: context.useCases.getAllocation,
    getPerformanceSummary: context.useCases.getPerformanceSummary,
    getPerformanceHistory: context.useCases.getPerformanceHistory,
    getExchangeRates: context.useCases.getExchangeRates,
  });

  registerAllSpecializedTools(server, {
    getActivities: context.useCases.getActivities,
    getDividends: context.useCases.getDividends,
    getNetWorth: context.useCases.getNetWorth,
    getHealth: context.useCases.getHealth,
    computeRebalancing: context.useCases.computeRebalancing,
    syncPrices: context.useCases.syncPrices,
    getHoldings: context.useCases.getHoldings,
  });

  return server;
}

export function getServerMetadata(): PackageMetadata {
  return PACKAGE_METADATA;
}

function loadPackageMetadata(): PackageMetadata {
  const packageJson = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf-8"),
  ) as unknown;

  if (!isPackageMetadata(packageJson)) {
    throw new Error("Invalid package metadata");
  }

  return {
    name: packageJson.name,
    version: packageJson.version,
  };
}

function isPackageMetadata(value: unknown): value is PackageMetadata {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === "string" && typeof candidate.version === "string";
}

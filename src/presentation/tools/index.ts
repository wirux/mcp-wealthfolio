import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ListAccountsUseCase } from "../../use-cases/list-accounts.js";
import type { GetHoldingsUseCase } from "../../use-cases/get-holdings.js";
import type { GetHoldingDetailUseCase } from "../../use-cases/get-holding-detail.js";
import type { GetAllocationUseCase } from "../../use-cases/get-allocation.js";
import type { GetPerformanceSummaryUseCase } from "../../use-cases/get-performance-summary.js";
import type { GetPerformanceHistoryUseCase } from "../../use-cases/get-performance-history.js";
import type { GetActivitiesUseCase } from "../../use-cases/get-activities.js";
import type { GetDividendsUseCase } from "../../use-cases/get-dividends.js";
import type { GetNetWorthUseCase } from "../../use-cases/get-net-worth.js";
import type { GetHealthUseCase } from "../../use-cases/get-health.js";
import type { GetExchangeRatesUseCase } from "../../use-cases/get-exchange-rates.js";
import type { ComputeRebalancingUseCase } from "../../use-cases/compute-rebalancing.js";
import type { SyncPricesUseCase } from "../../use-cases/sync-prices.js";
import { registerListAccountsTool } from "./list-accounts.tool.js";
import { registerGetHoldingsTool } from "./get-holdings.tool.js";
import { registerGetHoldingDetailTool } from "./get-holding-detail.tool.js";
import { registerGetAllocationTool } from "./get-allocation.tool.js";
import { registerGetPerformanceSummaryTool } from "./get-performance-summary.tool.js";
import { registerGetPerformanceHistoryTool } from "./get-performance-history.tool.js";
import { registerGetActivitiesTool } from "./get-activities.tool.js";
import { registerGetDividendsTool } from "./get-dividends.tool.js";
import { registerGetNetWorthTool } from "./get-net-worth.tool.js";
import { registerGetHealthTool } from "./get-health.tool.js";
import { registerGetExchangeRatesTool } from "./get-exchange-rates.tool.js";
import { registerComputeRebalancingTool } from "./compute-rebalancing.tool.js";
import { registerSyncPricesTool } from "./sync-prices.tool.js";

export interface QueryToolUseCases {
  listAccounts: ListAccountsUseCase;
  getHoldings: GetHoldingsUseCase;
  getHoldingDetail: GetHoldingDetailUseCase;
  getAllocation: GetAllocationUseCase;
  getPerformanceSummary: GetPerformanceSummaryUseCase;
  getPerformanceHistory: GetPerformanceHistoryUseCase;
  getExchangeRates: GetExchangeRatesUseCase;
}

export interface SpecializedToolUseCases {
  getActivities: GetActivitiesUseCase;
  getDividends: GetDividendsUseCase;
  getNetWorth: GetNetWorthUseCase;
  getHealth: GetHealthUseCase;
  computeRebalancing: ComputeRebalancingUseCase;
  syncPrices: SyncPricesUseCase;
  getHoldings: GetHoldingsUseCase;
}

export function registerAllQueryTools(server: McpServer, useCases: QueryToolUseCases): void {
  registerListAccountsTool(server, useCases);
  registerGetHoldingsTool(server, useCases);
  registerGetHoldingDetailTool(server, useCases);
  registerGetAllocationTool(server, useCases);
  registerGetPerformanceSummaryTool(server, useCases);
  registerGetPerformanceHistoryTool(server, useCases);
  registerGetExchangeRatesTool(server, useCases);
}

export function registerAllSpecializedTools(server: McpServer, useCases: SpecializedToolUseCases): void {
  registerGetActivitiesTool(server, useCases);
  registerGetDividendsTool(server, useCases);
  registerGetNetWorthTool(server, useCases);
  registerGetHealthTool(server, useCases);
  registerComputeRebalancingTool(server, useCases);
  registerSyncPricesTool(server, useCases);
}

export {
  registerListAccountsTool,
  registerGetHoldingsTool,
  registerGetHoldingDetailTool,
  registerGetAllocationTool,
  registerGetPerformanceSummaryTool,
  registerGetPerformanceHistoryTool,
  registerGetActivitiesTool,
  registerGetDividendsTool,
  registerGetNetWorthTool,
  registerGetHealthTool,
  registerGetExchangeRatesTool,
  registerComputeRebalancingTool,
  registerSyncPricesTool,
};

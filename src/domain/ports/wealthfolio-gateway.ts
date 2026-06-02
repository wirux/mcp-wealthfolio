import { Account } from "../entities/account.js";
import { Activity } from "../entities/activity.js";
import { ActivitySearchCriteria } from "../entities/activity-search-criteria.js";
import { Allocation } from "../entities/allocation.js";
import { ExchangeRate } from "../entities/exchange-rate.js";
import { Holding } from "../entities/holding.js";
import { NetWorth } from "../entities/net-worth.js";
import { PerformanceHistory } from "../entities/performance-history.js";
import { PerformanceSummary } from "../entities/performance-summary.js";

export interface HealthStatus {
  readonly healthy: boolean;
  readonly version?: string;
}

export interface PerformanceHistoryParams {
  itemType?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivitySearchResult {
  readonly activities: Activity[];
  readonly total: number;
}

export interface WealthfolioReadGateway {
  listAccounts(): Promise<Account[]>;
  getHoldings(accountId?: string): Promise<Holding[]>;
  getHoldingDetail(accountId: string, assetId: string): Promise<Holding>;
  getAllocations(accountId?: string): Promise<Allocation>;
  getPerformanceSummary(from?: string, to?: string): Promise<PerformanceSummary>;
  getPerformanceHistory(params: PerformanceHistoryParams): Promise<PerformanceHistory>;
  searchActivities(criteria: ActivitySearchCriteria): Promise<ActivitySearchResult>;
  getNetWorth(): Promise<NetWorth>;
  getExchangeRates(): Promise<ExchangeRate[]>;
  checkHealth(): Promise<HealthStatus>;
}

export interface WealthfolioWriteGateway {
  syncPrices(): Promise<void>;
}

export type WealthfolioGateway = WealthfolioReadGateway & WealthfolioWriteGateway;

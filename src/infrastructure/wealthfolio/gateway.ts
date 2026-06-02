import {
  Account,
  Activity,
  ActivitySearchCriteria,
  ACTIVITY_TYPES,
  Allocation,
  ExchangeRate,
  Holding,
  NetWorth,
  PerformanceHistory,
  PerformanceSummary,
} from "../../domain/entities/index.js";
import type { AllocationItem } from "../../domain/entities/index.js";
import type {
  ActivitySearchResult,
  HealthStatus,
  PerformanceHistoryParams,
  WealthfolioReadGateway,
  WealthfolioWriteGateway,
} from "../../domain/ports/wealthfolio-gateway.js";
import { AssetSymbol, Currency, Money, Percentage, Quantity } from "../../domain/value-objects/index.js";
import type { ActivityType } from "../../domain/entities/activity-type.js";
import type { WealthfolioClient } from "./client.js";

export class WealthfolioGatewayAdapter implements WealthfolioReadGateway, WealthfolioWriteGateway {
  constructor(private readonly client: WealthfolioClient) {}

  async listAccounts(): Promise<Account[]> {
    const raw = await this.client.get<unknown[]>("/api/v1/accounts");
    return expectArray(raw, "accounts").map((item) => this.mapAccount(item));
  }

  async getHoldings(accountId?: string): Promise<Holding[]> {
    if (accountId === undefined) {
      const accounts = await this.listAccounts();
      const perAccount = await Promise.all(accounts.map((a) => this.fetchHoldingsForAccount(a.id)));
      return perAccount.flat();
    }

    return this.fetchHoldingsForAccount(accountId);
  }

  private async fetchHoldingsForAccount(accountId: string): Promise<Holding[]> {
    const raw = await this.client.get<unknown[]>("/api/v1/holdings", { accountId });
    return expectArray(raw, "holdings")
      .filter((item) => {
        const record = item as Record<string, unknown>;
        const instrument = record.instrument;
        if (typeof instrument !== "object" || instrument === null) return false;
        const symbol = (instrument as Record<string, unknown>).symbol;
        if (!(typeof symbol === "string" && symbol.trim().length > 0)) return false;
        const qty = record.quantity;
        if (typeof qty === "number" && qty <= 0) return false;
        return true;
      })
      .map((item) => this.mapHolding(item));
  }

  async getHoldingDetail(accountId: string, assetId: string): Promise<Holding> {
    const resolvedId = await this.resolveAssetId(accountId, assetId);
    const raw = await this.client.get<unknown>("/api/v1/holdings/item", { accountId, assetId: resolvedId });
    return this.mapHolding(raw);
  }

  private async resolveAssetId(accountId: string, assetId: string): Promise<string> {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(assetId)) return assetId;

    const rawHoldings = await this.client.get<unknown[]>("/api/v1/holdings", { accountId });
    for (const item of expectArray(rawHoldings, "holdings")) {
      const record = item as Record<string, unknown>;
      const instrument = record.instrument;
      if (typeof instrument !== "object" || instrument === null) continue;
      const inst = instrument as Record<string, unknown>;
      if (typeof inst.symbol === "string" && inst.symbol === assetId && typeof inst.id === "string") {
        return inst.id;
      }
    }
    throw new Error(`Asset "${assetId}" not found in account ${accountId}`);
  }

  async getAllocations(accountId?: string): Promise<Allocation> {
    if (accountId === undefined) {
      const accounts = await this.listAccounts();
      const perAccount = await Promise.all(
        accounts.map((a) => this.fetchAllocationsForAccount(a.id)),
      );
      const allItems = perAccount.flatMap((alloc) => alloc.items);
      return Allocation.create(allItems);
    }

    return this.fetchAllocationsForAccount(accountId);
  }

  private async fetchAllocationsForAccount(accountId: string): Promise<Allocation> {
    const raw = await this.client.get<unknown>("/api/v1/allocations", { accountId });
    return this.mapAllocation(raw);
  }

  async getPerformanceSummary(from?: string, to?: string): Promise<PerformanceSummary> {
    const body: Record<string, string> = {
      itemType: "account",
      itemId: "TOTAL",
    };
    if (from !== undefined) {
      body.startDate = from;
    }
    if (to !== undefined) {
      body.endDate = to;
    }

    const raw = await this.client.post<unknown>("/api/v1/performance/summary", body);
    return this.mapPerformanceSummary(raw);
  }

  async getPerformanceHistory(params: PerformanceHistoryParams): Promise<PerformanceHistory> {
    const body: Record<string, string> = {
      itemType: params.itemType ?? "account",
      itemId: params.itemId ?? "TOTAL",
    };
    if (params.startDate !== undefined) {
      body.startDate = params.startDate;
    }
    if (params.endDate !== undefined) {
      body.endDate = params.endDate;
    }

    const raw = await this.client.post<unknown>("/api/v1/performance/history", body);
    return this.mapPerformanceHistory(raw);
  }

  async searchActivities(criteria: ActivitySearchCriteria): Promise<ActivitySearchResult> {
    const body = this.buildActivitySearchBody(criteria);
    const raw = await this.client.post<unknown>("/api/v1/activities/search", body);
    const record = expectRecord(raw, "activity search result");
    const data = expectArray(record.data, "activity search result data");

    const symbolMap = await this.buildAssetSymbolMap(data);

    return {
      activities: data.map((item) => this.mapActivity(item, symbolMap)),
      total: getNumber(
        record.total ?? record.totalCount ?? record.count,
        "activity search result total",
        data.length,
      ),
    };
  }

  private async buildAssetSymbolMap(activities: unknown[]): Promise<Map<string, string>> {
    const assetIds = new Set<string>();
    const accountIds = new Set<string>();
    for (const item of activities) {
      const record = item as Record<string, unknown>;
      if (typeof record.assetId === "string" && record.assetId.trim().length > 0) {
        assetIds.add(record.assetId);
        if (typeof record.accountId === "string") accountIds.add(record.accountId);
      }
    }
    if (assetIds.size === 0) return new Map();

    const symbolMap = new Map<string, string>();
    for (const accountId of accountIds) {
      const rawHoldings = await this.client.get<unknown[]>("/api/v1/holdings", { accountId });
      for (const h of expectArray(rawHoldings, "holdings")) {
        const rec = h as Record<string, unknown>;
        const instrument = rec.instrument;
        if (typeof instrument !== "object" || instrument === null) continue;
        const inst = instrument as Record<string, unknown>;
        if (typeof inst.id === "string" && typeof inst.symbol === "string") {
          symbolMap.set(inst.id, inst.symbol);
        }
      }
    }

    // Resolve remaining assetIds (e.g. sold positions) via /api/v1/assets
    const unresolvedIds = [...assetIds].filter((id) => !symbolMap.has(id));
    if (unresolvedIds.length > 0) {
      const rawAssets = await this.client.get<unknown[]>("/api/v1/assets");
      for (const asset of expectArray(rawAssets, "assets")) {
        const rec = asset as Record<string, unknown>;
        const id = typeof rec.id === "string" ? rec.id : undefined;
        const symbol =
          typeof rec.instrumentSymbol === "string"
            ? rec.instrumentSymbol
            : typeof rec.symbol === "string"
              ? rec.symbol
              : undefined;
        if (id !== undefined && symbol !== undefined && assetIds.has(id)) {
          symbolMap.set(id, symbol);
        }
      }
    }

    return symbolMap;
  }

  async getNetWorth(): Promise<NetWorth> {
    const raw = await this.client.get<unknown>("/api/v1/net-worth");
    return this.mapNetWorth(raw);
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    const raw = await this.client.get<unknown[]>("/api/v1/exchange-rates/latest");
    return expectArray(raw, "exchange rates").map((item) => this.mapExchangeRate(item));
  }

  async syncPrices(): Promise<void> {
    await this.client.post<undefined>("/api/v1/market-data/sync", { refetchAll: false });
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      const raw = await this.client.get<unknown>("/api/v1/healthz");
      const record = expectRecord(raw, "health status");
      const version = getOptionalString(record.version, "health status version");
      const status = getOptionalString(record.status, "health status status");

      return {
        healthy: status === undefined || status === "ok",
        ...(version !== undefined ? { version } : {}),
      };
    } catch {
      return { healthy: false };
    }
  }

  private mapAccount(raw: unknown): Account {
    const record = expectRecord(raw, "account");

    return Account.create({
      id: getString(record.id, "account id", ""),
      name: getString(record.name, "account name", ""),
      currency: Currency.create(getString(record.currency, "account currency", "USD")),
      isActive: getBoolean(record.isActive, "account isActive", true),
      ...(record.group !== undefined ? { group: getString(record.group, "account group", "") } : {}),
    });
  }

  private mapHolding(raw: unknown): Holding {
    const record = expectRecord(raw, "holding");
    const instrument = expectRecord(record.instrument, "holding instrument");
    const currency = getString(
      record.localCurrency ?? instrument.currency,
      "holding currency",
      "USD",
    );

    return Holding.create({
      id: getString(record.id, "holding id", ""),
      accountId: getString(record.accountId, "holding accountId", ""),
      symbol: AssetSymbol.create(getString(instrument.symbol, "holding instrument symbol", "")),
      quantity: Quantity.holding(getNumber(record.quantity, "holding quantity", 0)),
      marketValue: Money.fromRaw(getMonetaryValueLocal(record.marketValue, "holding marketValue", 0), currency),
      costBasis: Money.fromRaw(getMonetaryValueLocal(record.costBasis, "holding costBasis", 0), currency),
      unrealizedGainLoss: Money.fromRaw(
        getMonetaryValueLocal(record.unrealizedGain, "holding unrealizedGain", 0),
        currency,
      ),
      unrealizedGainLossPercent: safePercentage(getNumber(record.unrealizedGainPct, "holding unrealizedGainPct", 0)),
      weight: safePercentage(getNumber(record.weight, "holding weight", 0)),
      ...(record.holdingType !== undefined
        ? { assetType: getString(record.holdingType, "holding holdingType", "") }
        : {}),
    });
  }

  private mapAllocation(raw: unknown): Allocation {
    const record = expectRecord(raw, "allocation");
    const currency = "USD";

    const taxonomyKeys = ["assetClasses", "sectors", "regions", "riskCategory", "securityTypes"];
    const items: AllocationItem[] = [];

    for (const key of taxonomyKeys) {
      if (record[key] === undefined || record[key] === null) continue;
      const taxonomy = expectRecord(record[key], `allocation ${key}`);
      const name = getString(taxonomy.taxonomyName, `${key} taxonomyName`, key);
      const categories = this.mapAllocationCategories(taxonomy.categories, currency);
      if (categories.length === 0) continue;

      const totalValue = categories.reduce((sum, c) => sum + c.value.amount, 0);
      items.push({
        label: name,
        value: Money.fromRaw(totalValue, currency),
        weight: safePercentage(1),
        children: categories,
      });
    }

    if (Array.isArray(record.customGroups)) {
      for (const group of record.customGroups as unknown[]) {
        const taxonomy = expectRecord(group, "allocation customGroup");
        const name = getString(taxonomy.taxonomyName, "customGroup taxonomyName", "Custom");
        const categories = this.mapAllocationCategories(taxonomy.categories, currency);
        if (categories.length === 0) continue;

        const totalValue = categories.reduce((sum, c) => sum + c.value.amount, 0);
        items.push({
          label: name,
          value: Money.fromRaw(totalValue, currency),
          weight: safePercentage(1),
          children: categories,
        });
      }
    }

    return Allocation.create(items);
  }

  private mapAllocationCategories(raw: unknown, currency: string): AllocationItem[] {
    if (raw === undefined || raw === null) return [];
    return expectArray(raw, "allocation categories").map((item) => {
      const record = expectRecord(item, "allocation category");
      const children =
        record.children !== undefined && record.children !== null
          ? this.mapAllocationCategories(record.children, currency)
          : undefined;

      const pctRaw = getNumber(record.percentage ?? record.weight, "category percentage", 0);
      const pctNormalized = pctRaw > 1 ? pctRaw / 100 : pctRaw;

      return {
        label: getString(record.categoryName ?? record.label, "category name", ""),
        value: Money.fromRaw(getNumber(record.value, "category value", 0), currency),
        weight: safePercentage(pctNormalized),
        ...(children !== undefined && children.length > 0 ? { children } : {}),
      };
    });
  }

  private mapPerformanceSummary(raw: unknown): PerformanceSummary {
    const record = expectRecord(raw, "performance summary");
    const currency = getString(record.currency, "performance summary currency", "USD");

    const gainLoss = getNumber(record.gainLossAmount ?? record.periodGain, "performance summary gainLoss", 0);
    const gainLossPct = getNumber(record.simpleReturn, "performance summary simpleReturn", 0);

    const periodStartDate = getOptionalString(record.periodStartDate, "performance summary periodStartDate");
    const periodEndDate = getOptionalString(record.periodEndDate, "performance summary periodEndDate");
    const period =
      periodStartDate !== undefined && periodEndDate !== undefined
        ? { from: periodStartDate, to: periodEndDate }
        : undefined;

    const twrRaw = getOptionalNumber(record.cumulativeTwr, "performance summary cumulativeTwr");
    const mwrRaw = getOptionalNumber(record.cumulativeMwr, "performance summary cumulativeMwr");

    return PerformanceSummary.create({
      totalValue: Money.fromRaw(getNumber(record.totalValue, "performance summary totalValue", 0), currency),
      totalGainLoss: Money.fromRaw(gainLoss, currency),
      totalGainLossPercent: safePercentage(gainLossPct),
      ...(twrRaw !== undefined ? { twr: safePercentage(twrRaw) } : {}),
      ...(mwrRaw !== undefined ? { mwr: safePercentage(mwrRaw) } : {}),
      ...(period !== undefined ? { period } : {}),
    });
  }

  private mapPerformanceHistory(raw: unknown): PerformanceHistory {
    const record = expectRecord(raw, "performance history");
    const currency = getString(record.currency, "performance history currency", "USD");
    const returns = expectArray(record.returns, "performance history returns");

    const dataPoints = returns.map((item) => {
      const point = expectRecord(item, "performance return data point");
      return {
        date: getString(point.date, "return data point date", ""),
        value: Money.fromRaw(getNumber(point.totalValue ?? point.value, "return data point value", 0), currency),
      };
    });

    return PerformanceHistory.create({ dataPoints });
  }

  private mapActivity(raw: unknown, symbolMap: Map<string, string>): Activity {
    const record = expectRecord(raw, "activity");
    const currency = getString(record.currency, "activity currency", "USD");

    const assetId = getOptionalString(record.assetId, "activity assetId");
    const rawSymbolStr =
      getOptionalString(record.symbol, "activity symbol") ??
      getOptionalString(record.assetSymbol, "activity assetSymbol");
    const rawSymbol = rawSymbolStr !== undefined && rawSymbolStr.trim().length > 0 ? rawSymbolStr : undefined;
    const resolvedSymbol = rawSymbol ?? (assetId !== undefined ? symbolMap.get(assetId) : undefined);

    const quantity = getOptionalNumber(record.quantity, "activity quantity");
    const unitPriceAmount = getOptionalNumber(record.unitPrice, "activity unitPrice");
    const feeAmount = getOptionalNumber(record.fee, "activity fee");
    const description = getOptionalString(record.comment, "activity comment");

    return Activity.create({
      id: getString(record.id, "activity id", ""),
      accountId: getString(record.accountId, "activity accountId", ""),
      activityType: getActivityType(record.activityType),
      totalAmount: Money.fromRaw(getNumber(record.amount, "activity amount", 0), currency),
      date: getString(record.date, "activity date", ""),
      ...(resolvedSymbol !== undefined ? { symbol: AssetSymbol.create(resolvedSymbol) } : {}),
      ...(quantity !== undefined ? { quantity: Quantity.delta(quantity) } : {}),
      ...(unitPriceAmount !== undefined
        ? { unitPrice: Money.fromRaw(unitPriceAmount, currency) }
        : {}),
      ...(feeAmount !== undefined && feeAmount !== 0
        ? { fee: Money.fromRaw(feeAmount, currency) }
        : {}),
      ...(description !== undefined ? { description } : {}),
    });
  }

  private mapNetWorth(raw: unknown): NetWorth {
    const record = expectRecord(raw, "net worth");
    const currency = getString(record.currency, "net worth currency", "USD");

    const assetsRecord = record.assets ?? record.investments;
    const assetsTotal =
      typeof assetsRecord === "object" && assetsRecord !== null && !Array.isArray(assetsRecord)
        ? getNumber((assetsRecord as Record<string, unknown>).total, "net worth assets.total", 0)
        : getNumber(assetsRecord, "net worth assets", 0);

    const liabilitiesRecord = record.liabilities;
    let liabilitiesTotal: number | undefined;
    if (liabilitiesRecord !== undefined && liabilitiesRecord !== null) {
      liabilitiesTotal =
        typeof liabilitiesRecord === "object" && !Array.isArray(liabilitiesRecord)
          ? getNumber((liabilitiesRecord as Record<string, unknown>).total, "net worth liabilities.total", 0)
          : getNumber(liabilitiesRecord, "net worth liabilities", 0);
    }

    return NetWorth.create({
      totalNetWorth: Money.fromRaw(getNumber(record.netWorth ?? record.totalNetWorth, "net worth totalNetWorth", 0), currency),
      investments: Money.fromRaw(assetsTotal, currency),
      ...(liabilitiesTotal !== undefined
        ? { liabilities: Money.fromRaw(liabilitiesTotal, currency) }
        : {}),
      asOf: getString(record.date ?? record.asOf, "net worth date", ""),
    });
  }

  private mapExchangeRate(raw: unknown): ExchangeRate {
    const record = expectRecord(raw, "exchange rate");

    return ExchangeRate.create(
      Currency.create(getString(record.fromCurrency, "exchange rate fromCurrency", "USD")),
      Currency.create(getString(record.toCurrency, "exchange rate toCurrency", "USD")),
      getNumber(record.rate, "exchange rate rate", 1),
      getString(record.timestamp, "exchange rate timestamp", ""),
    );
  }

  private buildActivitySearchBody(criteria: ActivitySearchCriteria): Record<string, unknown> {
    const body: Record<string, unknown> = {
      page: criteria.page,
      pageSize: criteria.pageSize,
    };

    if (criteria.accountIdFilter !== undefined) {
      body.accountIdFilter = criteria.accountIdFilter;
    }
    if (criteria.activityTypeFilter !== undefined) {
      body.activityTypeFilter = criteria.activityTypeFilter;
    }
    if (criteria.assetIdKeyword !== undefined) {
      body.assetIdKeyword = criteria.assetIdKeyword;
    }
    if (criteria.dateFrom !== undefined) {
      body.dateFrom = criteria.dateFrom;
    }
    if (criteria.dateTo !== undefined) {
      body.dateTo = criteria.dateTo;
    }
    if (criteria.sort !== undefined) {
      body.sort = {
        field: criteria.sort.field,
        direction: criteria.sort.direction,
      };
    }

    return body;
  }
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value as Record<string, unknown>;
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function getString(value: unknown, label: string, fallback: string): string {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function getOptionalString(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function getNumber(value: unknown, label: string, fallback: number): number {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function getOptionalNumber(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function getBoolean(value: unknown, label: string, fallback: boolean): boolean {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== "boolean") {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function getActivityType(value: unknown): ActivityType {
  const activityType = getString(value, "activity type", "");

  if (!ACTIVITY_TYPES.includes(activityType as ActivityType)) {
    throw new Error(`Invalid activity type: ${activityType}`);
  }

  return activityType as ActivityType;
}

/**
 * Extract the local amount from a Wealthfolio MonetaryValue object `{ local, base }`.
 * Falls back to treating the value as a plain number/string if it's not an object.
 */
function getMonetaryValueLocal(value: unknown, label: string, fallback: number): number {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "number" || typeof value === "string") {
    return getNumber(value, label, fallback);
  }

  const record = expectRecord(value, label);
  return getNumber(record.local, `${label}.local`, fallback);
}

/**
 * Clamp a number to the [0, 1] range required by Percentage.create().
 * Wealthfolio returns gain/loss percentages that can be negative (losses) or > 1 (>100% gains).
 */
function safePercentage(value: number): Percentage {
  return Percentage.create(Math.max(0, Math.min(1, value)));
}

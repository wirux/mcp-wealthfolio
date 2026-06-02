# @wirux/mcp-wealthfolio — Architecture Reference

## Architecture

```
src/
├── domain/          Entities, value objects, ports (interfaces), domain errors
├── use-cases/       Application services orchestrating domain logic
├── infrastructure/  Adapters: Wealthfolio HTTP client, auth, config, cache
└── presentation/    MCP tool bindings, zod schemas, transport (stdio/HTTP)
```

## Layer Rules

| Layer | May import from | Must NOT import from |
|-------|----------------|----------------------|
| `domain/` | nothing | use-cases, infrastructure, presentation |
| `use-cases/` | domain/ | infrastructure, presentation |
| `infrastructure/` | domain/ | use-cases, presentation |
| `presentation/` | domain/, use-cases/ | infrastructure/ directly |

Dependency direction: inward only. Outer layers depend on inner, never the reverse.

## Naming Conventions

- Files: `kebab-case.ts` (e.g., `auth-manager.ts`, `get-holdings.ts`)
- Classes: `PascalCase` (e.g., `AuthManager`, `GetHoldingsUseCase`)
- MCP tool names: `snake_case` (e.g., `get_holdings`, `compute_rebalancing`)
- Test files: `foo.ts` + `foo.test.ts` co-located in same directory
- Port interfaces: noun (e.g., `WealthfolioReadGateway`, `WealthfolioWriteGateway`, `Logger`, `Clock`)
- Errors: `PascalCaseError` extending `DomainError`
- Value Objects: Noun (e.g., `Money`, `Percentage`). VO suffix is optional.

## Testing

Three tiers:
1. **Unit** — domain VOs, entities, use-cases with mocked ports. No I/O.
2. **Adapter integration** — HTTP client against recorded fixtures in `tests/fixtures/`.
3. **End-to-end** — `InMemoryTransport.createLinkedPair()` full round-trip.

Commands:
```bash
npm test                  # vitest run (all tests)
npm run test:watch        # vitest watch mode
npm run test:coverage     # vitest run --coverage (≥80% required)
npm run lint              # tsc --noEmit (only linter used)
npm run build             # tsc (compile to dist/)
```

Coverage targets: ≥80% overall, 100% on `src/domain/**`.

## Common Patterns

### Value Object Factory
Value objects use private constructors and static `create` or `of` methods. They throw `Error` or `ValidationError` on invalid input.
```typescript
// src/domain/value-objects/percentage.ts
static create(value: number): Percentage {
  if (value < 0 || value > 1) throw new Error("Percentage must be between 0 and 1");
  return new Percentage(value);
}
```

### Use-Case Class
Use-cases are single-purpose classes with constructor injection and one `execute()` method.

Read use-cases inject `WealthfolioReadGateway`; `SyncPricesUseCase` injects `WealthfolioWriteGateway`. `WealthfolioGateway = WealthfolioReadGateway & WealthfolioWriteGateway` (intersection type in `src/domain/ports/wealthfolio-gateway.ts`).
```typescript
class ListAccountsUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}
  async execute(): Promise<Account[]> {
    return this.gateway.listAccounts();
  }
}
```

### MCP Tool Handler
Handlers use try/catch blocks. Domain errors are caught and returned as MCP errors.
```typescript
server.registerTool("list_accounts", {
  description: "List all investment accounts.",
  inputSchema: z.object({}),
  annotations: { readOnlyHint: true },
}, async () => {
  try {
    const result = await useCases.listAccounts.execute();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return { content: [{ type: "text", text: String(err) }], isError: true };
  }
});
```

### Error Handling
There are six main error types extending the `DomainError` base class:
1. `DomainError`: Base abstract class for all domain errors.
2. `AuthenticationError`: When login or token refresh fails.
3. `ConnectionError`: When the Wealthfolio API is unreachable.
4. `ApiError`: When the API returns an error response (e.g., 4xx, 5xx).
5. `ValidationError`: For invalid domain data or input parameters.
6. `InvalidTargetAllocationError`: When target weights don't sum to 1.0.
7. `ResponseTooLargeError` (code: `RESPONSE_TOO_LARGE`): When a response body exceeds the 10MB limit.

## Domain Vocabulary

| Term | Description |
|------|-------------|
| `Holding` | Current position: symbol, quantity, market value, cost basis |
| `Activity` | Transaction: BUY, SELL, DIVIDEND, INTEREST, etc. |
| `Allocation` | Portfolio breakdown by asset class, sector, currency, etc. |
| `TargetAllocation` | Desired weights (symbol to Percentage), must sum to 1.0 ± 0.001 |
| `Drift` | Difference between current and target weight for one symbol |
| `RebalancingPlan` | Collection of Drifts, sorted by absolute drift descending |
| `Money` | Amount + Currency, rounded to currency's minor units |
| `Percentage` | 0..1 range (not 0 to 100) |
| `ActivitySearchCriteria` | Filters for searching activities (page, dateRange, etc.) |

## Wealthfolio Integration

### Auth Flow
1. `POST /api/v1/auth/login` with `{ password }` returns `{ authenticated, expiresIn }` and an HttpOnly cookie.
2. The cookie is sent on all subsequent requests.
3. Refresh the session when 50% of the TTL has passed. Concurrent refresh requests share one login call using a mutex.

### Endpoint Map
| Tool | Method | Path |
|------|--------|------|
| `list_accounts` | GET | `/api/v1/accounts` |
| `get_holdings` | GET | `/api/v1/holdings` |
| `get_holding_detail` | GET | `/api/v1/holdings/item?accountId&assetId` |
| `get_allocation` | GET | `/api/v1/allocations` |
| `get_performance_summary` | POST | `/api/v1/performance/summary` |
| `get_performance_history` | POST | `/api/v1/performance/history` |
| `get_activities` | POST | `/api/v1/activities/search` |
| `get_net_worth` | GET | `/api/v1/net-worth` |
| `get_exchange_rates` | GET | `/api/v1/exchange-rates/latest` |
| `sync_prices` | POST | `/api/v1/market-data/sync` |
| `get_health` | GET | `/api/v1/healthz` |

### Key Constraints
- ESM imports must include the `.js` extension.
- Use `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
- No `console.log` calls. Use `console.error` for logging.
- Read-only operations by default. Write operations (e.g., `sync_prices`) must be explicitly whitelisted in `client.ts` `assertReadOnly()`.
- **10MB response limit**: responses with `Content-Length > 10_485_760` throw `ResponseTooLargeError`.
- **Cookie validation**: cookie name and value are validated before use.
- **Auth timeout**: 10-second `AbortController` timeout on login requests.
- **Path traversal guard**: password file path is checked for `../` before reading.

### Critical: Never log credentials
All log calls go to stderr. `console.log` is FORBIDDEN as it corrupts the stdio JSON-RPC transport.

## Transport

`src/presentation/transports/index.ts` exports `createTransport(config: TransportConfig): TransportResult`.

```typescript
interface TransportConfig {
  mcpTransportType: "stdio" | "http";
  port?: number;          // only used when mcpTransportType === "http" (default 3000)
}
```

`TransportConfig` is defined locally in `transports/index.ts` — it does **not** import from `infrastructure/`. Returns a discriminated union `{ kind: "stdio" | "http"; transport; ... }`.

## compute_rebalancing Output

`compute_rebalancing` returns structured JSON (not a markdown table):
```json
{
  "totalValue": 10000,
  "currency": "USD",
  "cashRemaining": 42.50,
  "recommendations": [
    { "symbol": "VTI", "action": "BUY", "amount": 500, "shares": 2.1 }
  ]
}
```

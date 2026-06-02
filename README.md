<div align="center">

# 💰 MCP Wealthfolio

**[MCP](https://modelcontextprotocol.io/) server for Wealthfolio — portfolio analysis and advisory rebalancing for LLM clients.**

`npx` and connect your self-hosted portfolio tracker to any AI assistant. Read-only by default. Multi-currency. Rebalancing built-in.

[![CI/CD](https://github.com/wirux/mcp-wealthfolio/actions/workflows/release.yml/badge.svg)](https://github.com/wirux/mcp-wealthfolio/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@wirux/mcp-wealthfolio?color=cb3837&logo=npm)](https://www.npmjs.com/package/@wirux/mcp-wealthfolio)
[![Docker](https://img.shields.io/badge/ghcr.io-mcp--wealthfolio-blue?logo=docker)](https://github.com/wirux/mcp-wealthfolio/pkgs/container/mcp-wealthfolio)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-1.11.0-blue.svg)](https://github.com/modelcontextprotocol/specification)
[![Tests](https://img.shields.io/badge/tests-300%2B%20passed-brightgreen?logo=vitest&logoColor=white)](#-testing)

</div>

---

## 💡 Why this server?

> **TL;DR** — One `npx` command. Read-only by default. Multi-currency. Advisory rebalancing. No trade execution.

| | Differentiator | Details |
|---|---|---|
| 🔒 | **Read-only by default** | 12 of 13 tools are strictly read-only. No trade execution, no deletions. Only `sync_prices` can trigger market data updates. |
| 🌍 | **Multi-currency native** | Handles portfolios across diverse currencies with automatic base-currency conversion and live exchange rates. |
| ⚖️ | **Advisory rebalancing** | Compute deltas to reach target allocation with structured JSON recommendations — no guesswork, no manual math. |
| 📊 | **Deep analytics** | Per-lot cost basis, unrealized gains, TWR performance, dividend streams, allocation breakdowns by class/sector/currency. |
| 🐳 | **Docker ready** | Fully containerized, optimized for deployment alongside your Wealthfolio instance. Stdio or HTTP transport. |
| 🏛️ | **Clean Architecture** | Domain-driven design with strict layer separation, Zod validation, and comprehensive test coverage. |

<div align="center">

🖥️ **Claude Desktop** · 🤖 **Claude Code** · 🔧 **Any MCP Client**

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🛡️ | **Secure by design** | Loopback-only HTTP, credential scrubbing, Docker secrets support, error masking |
| 💱 | **Exchange rates** | Live rates for multi-currency valuation and conversion |
| 📈 | **Performance metrics** | Total return, TWR, gain/loss for any date range with history time series |
| 📋 | **Transaction history** | Flexible filtering, pagination, keyword search across all activities |
| 💸 | **Dividend tracking** | Filter by account and year for income yield analysis |
| 🔄 | **Price sync** | Trigger incremental market data updates directly from agent context |
| 📡 | **Dual transport** | Stdio (local pipe) or streamable HTTP (network/cloud) |
| ✅ | **Zod validation** | Strict schema validation for all inputs and configuration |

---

## 🛠️ MCP Tools

13 specialized tools for granular access to your investment data:

| Tool | Description | Key Parameters |
|---|---|---|
| 📋 `list_accounts` | List all investment accounts — discover account IDs, names, types | — |
| 💼 `get_holdings` | Current positions with market values and quantities | `account_id` |
| 🔍 `get_holding_detail` | Detailed holding: cost basis, unrealized gain/loss, quantity | `account_id`, `asset_id` |
| 🥧 `get_allocation` | Allocation breakdown by asset class, sector, currency | `account_id` |
| 📈 `get_performance_summary` | Performance summary: total return, TWR, gain/loss metrics | `from`, `to` |
| 📉 `get_performance_history` | Performance time series for portfolio or benchmark | `item_type`, `item_id`, `start_date`, `end_date` |
| 📝 `get_activities` | Search activities with pagination, type filters, keyword search | `account_id`, `activity_types`, `symbol_keyword`, `page` |
| 💸 `get_dividends` | Dividend activities filtered by account and/or year | `account_id`, `year` |
| 💰 `get_net_worth` | Current net worth aggregated across all accounts | — |
| 💱 `get_exchange_rates` | Current exchange rates for multi-currency valuation | — |
| 🏥 `get_health` | Health check — confirm Wealthfolio is reachable | — |
| 🔄 `sync_prices` | **Mutating**: Trigger incremental market price sync | — |
| ⚖️ `compute_rebalancing` | Compute rebalancing plan with target weights and optional cash | `target_weights`, `cash_to_invest` |

> All tools except `sync_prices` are read-only.

---

## 🚀 Quick Start

### 📦 Using npx

```bash
export WEALTHFOLIO_URL="http://your-wealthfolio:8088"
export WEALTHFOLIO_PASSWORD="your-secure-password"

npx -y @wirux/mcp-wealthfolio
```

### 🔌 Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wealthfolio": {
      "command": "npx",
      "args": ["-y", "@wirux/mcp-wealthfolio"],
      "env": {
        "WEALTHFOLIO_URL": "http://localhost:8088",
        "WEALTHFOLIO_PASSWORD": "your-password",
        "MCP_TRANSPORT_TYPE": "stdio"
      }
    }
  }
}
```

### 🐳 Docker

```bash
docker run -d \
  --name mcp-wealthfolio \
  -p 3000:3000 \
  -e WEALTHFOLIO_URL=http://wealthfolio:8088 \
  -e WEALTHFOLIO_PASSWORD=your-secret-password \
  -e WEALTHFOLIO_ALLOW_INSECURE=true \
  -e MCP_TRANSPORT_TYPE=http \
  -e PORT=3000 \
  ghcr.io/wirux/mcp-wealthfolio:latest
```

Or use Docker Compose:

```bash
docker compose up -d
```

The included `docker-compose.yml` uses HTTP transport on port 3000. Set `WEALTHFOLIO_PASSWORD` in a `.env` file or export it before running.

---

## 🌐 Transport Modes

| Mode | Use case | How it works |
|---|---|---|
| 📡 `stdio` *(default)* | Local MCP clients (Claude Desktop) | Reads/writes stdin/stdout; most secure, no network ports |
| 🌊 `http` | Network/cloud deployments | Streamable HTTP server; clients connect over the network |

```bash
# HTTP mode
MCP_TRANSPORT_TYPE=http PORT=3000 npx @wirux/mcp-wealthfolio
```

---

## ⚙️ Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEALTHFOLIO_URL` | No | `http://127.0.0.1:8088` | Base URL of your Wealthfolio instance |
| `WEALTHFOLIO_PASSWORD` | Yes* | — | Wealthfolio web-mode password |
| `WEALTHFOLIO_PASSWORD_FILE` | No | — | Path to password file (Docker Secrets) |
| `WEALTHFOLIO_ALLOW_INSECURE` | No | `false` | Allow HTTP to non-loopback addresses |
| `MCP_TRANSPORT_TYPE` | No | `stdio` | Transport: `stdio` or `http` |
| `PORT` | No | `3000` | HTTP server port (http mode only) |
| `LOG_LEVEL` | No | `info` | Verbosity: `trace` `debug` `info` `warn` `error` |

*\*Required if Wealthfolio is password-protected. `WEALTHFOLIO_PASSWORD_FILE` takes precedence over `WEALTHFOLIO_PASSWORD`.*

---

## 🏗️ Architecture

Clean Architecture with strict inward dependency direction:

```
src/
├── domain/          🔷 Entities, value objects, ports (interfaces), domain errors
├── use-cases/       🔶 Application services orchestrating domain logic
├── infrastructure/  🟢 Adapters: Wealthfolio HTTP client, auth, config, cache
└── presentation/    🟣 MCP tool bindings, zod schemas, transport (stdio/HTTP)
```

| Layer | May import from | Must NOT import from |
|---|---|---|
| **Domain** | nothing | use-cases, infrastructure, presentation |
| **Use Cases** | domain | infrastructure, presentation |
| **Infrastructure** | domain | use-cases, presentation |
| **Presentation** | domain, use-cases | infrastructure directly |

---

## 🧪 Testing

**300+ tests** across all layers, maintaining ≥80% coverage overall and 100% on domain logic.

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (≥80% required)
npm run lint          # tsc --noEmit
```

> Tests use mocked ports for unit tests, recorded API fixtures for integration, and `InMemoryTransport.createLinkedPair()` for E2E.

---

## 🔒 Security

| | Protection | Details |
|---|---|---|
| 🛡️ | **Minimal surface area** | 12/13 tools are read-only. No trade execution or destructive operations. |
| 🔐 | **Secure credentials** | Docker secrets support. No credentials in env or process listings. |
| 🌐 | **Network security** | Loopback-only HTTP by default. Explicit opt-in for non-localhost. |
| 🚫 | **No sensitive logging** | Tokens and passwords scrubbed. Logs to stderr only. |
| 🛑 | **Path traversal guard** | Password file paths validated against `../` attacks. |
| 🎭 | **Error masking** | Internal details never exposed in MCP error messages. |

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

---

## 🚢 CI/CD & Release

| Workflow | Trigger | What it does |
|---|---|---|
| **PR Check** | Pull request to `main` | Lint → Build → Test |
| **Release** | Push to `main` | Lint → Test → Semantic Release (NPM + GitHub Release) → Docker build & push |

- Versioning follows [Conventional Commits](https://www.conventionalcommits.org/) — `feat:` = minor, `fix:` = patch, `feat!:` = major
- Docker images built for `linux/amd64` and `linux/arm64`
- NPM: [`@wirux/mcp-wealthfolio`](https://www.npmjs.com/package/@wirux/mcp-wealthfolio)
- Docker: [`ghcr.io/wirux/mcp-wealthfolio`](https://github.com/wirux/mcp-wealthfolio/pkgs/container/mcp-wealthfolio)

---

## 🤝 Contributing

We welcome contributions! Before submitting a PR:

- Follow the Clean Architecture layer rules
- Add unit tests for new logic
- Pass `npm run lint` and `npm test`
- Use conventional commits (`feat:`, `fix:`, etc.)
- Update docs if introducing new config or tools

---

## 📄 License

[MIT](LICENSE)


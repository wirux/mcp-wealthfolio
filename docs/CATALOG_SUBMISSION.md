# MCP Catalog Submission Guide

After publishing `@wirux/mcp-wealthfolio` to npm, submit to the following MCP catalogs:

## Catalogs

### 1. mcp.so
- URL: https://mcp.so/submit
- Required: package name, description, GitHub URL, npm URL
- Category: Finance / Portfolio Management

### 2. mcpservers.org
- URL: https://mcpservers.org/submit
- Required: name, description, GitHub URL, npm install command
- Category: Finance

### 3. glama.ai
- URL: https://glama.ai/mcp/servers/submit
- Required: GitHub repository URL
- Auto-detects package metadata from package.json

### 4. smithery.ai
- URL: https://smithery.ai/submit
- Required: GitHub repository URL, description
- Supports automatic tool discovery

## Submission Details

**Package name**: `@wirux/mcp-wealthfolio`

**npm install command**:
```bash
npx @wirux/mcp-wealthfolio
```

**GitHub URL**: https://github.com/wirux/mcp-wealthfolio

**Description**: Read-only MCP server exposing a self-hosted Wealthfolio portfolio tracker to LLM clients. Provides 13 tools for portfolio analysis, performance tracking, dividend review, market price sync, and rebalancing recommendations.

**Tags/Keywords**: mcp, wealthfolio, portfolio, finance, investing, rebalancing, llm, claude

**Claude Desktop config snippet**:
```json
{
  "mcpServers": {
    "wealthfolio": {
      "command": "npx",
      "args": ["-y", "@wirux/mcp-wealthfolio"],
      "env": {
        "WEALTHFOLIO_URL": "http://localhost:8088",
        "WEALTHFOLIO_PASSWORD": "your-password"
      }
    }
  }
}
```

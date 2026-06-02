import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SyncPricesUseCase } from "../../use-cases/sync-prices.js";

interface UseCases {
  syncPrices: SyncPricesUseCase;
}

export function registerSyncPricesTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "sync_prices",
    {
      description: "Trigger an incremental sync of market prices for all portfolio holdings — this is a mutating write operation that updates stored price data in Wealthfolio. Use this tool before fetching holdings or net worth when you need up-to-date market valuations; avoid calling it repeatedly in quick succession.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: false },
    },
    async () => {
      try {
        await useCases.syncPrices.execute();
        return { content: [{ type: "text" as const, text: "Prices synced successfully." }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

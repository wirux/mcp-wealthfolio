import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPerformanceHistoryUseCase } from "../../use-cases/get-performance-history.js";

interface UseCases {
  getPerformanceHistory: GetPerformanceHistoryUseCase;
}

export function registerGetPerformanceHistoryTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_performance_history",
    {
      description:
        "Get portfolio or benchmark performance history. " +
        "Use item_type='account' item_id='TOTAL' for total portfolio (default). " +
        "Use item_type='symbol' item_id='<TICKER>' for benchmark/asset performance " +
        "(e.g. item_id='^GSPC' for S&P 500, 'SPY' for SPDR S&P 500 ETF). " +
        "Optionally filter by start_date and end_date (YYYY-MM-DD).",
      inputSchema: z.object({
        item_type: z.string().optional(),
        item_id: z.string().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ item_type, item_id, start_date, end_date }) => {
      try {
        const params: { itemType?: string; itemId?: string; startDate?: string; endDate?: string } =
          {};
        if (item_type !== undefined) params.itemType = item_type;
        if (item_id !== undefined) params.itemId = item_id;
        if (start_date !== undefined) params.startDate = start_date;
        if (end_date !== undefined) params.endDate = end_date;
        const result = await useCases.getPerformanceHistory.execute(params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

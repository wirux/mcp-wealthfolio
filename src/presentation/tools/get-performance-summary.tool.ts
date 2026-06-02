import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPerformanceSummaryUseCase } from "../../use-cases/get-performance-summary.js";

interface UseCases {
  getPerformanceSummary: GetPerformanceSummaryUseCase;
}

export function registerGetPerformanceSummaryTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_performance_summary",
    {
      description: "Get portfolio performance summary for a date range (from/to as ISO date strings), returning metrics such as total return, time-weighted return, and gain/loss. Use this tool when an agent needs to evaluate how the portfolio performed over a specific period.",
      inputSchema: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ from, to }) => {
      try {
        const result = await useCases.getPerformanceSummary.execute(from, to);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

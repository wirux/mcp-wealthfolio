import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetDividendsUseCase } from "../../use-cases/get-dividends.js";

interface UseCases {
  getDividends: GetDividendsUseCase;
}

export function registerGetDividendsTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_dividends",
    {
      description: "Get dividend activities, optionally filtered by account and/or year. Returns a list of dividend payment records including amounts, dates, and symbols — use this tool when an agent needs to calculate income yield, track dividend history, or generate tax-related reports.",
      inputSchema: z.object({
        account_id: z.string().optional(),
        year: z.number().int().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      try {
        const params: Parameters<typeof useCases.getDividends.execute>[0] = {};
        if (args.account_id !== undefined) params.accountId = args.account_id;
        if (args.year !== undefined) params.year = args.year;

        const result = await useCases.getDividends.execute(params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

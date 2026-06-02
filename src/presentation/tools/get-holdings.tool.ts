import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetHoldingsUseCase } from "../../use-cases/get-holdings.js";

interface UseCases {
  getHoldings: GetHoldingsUseCase;
}

export function registerGetHoldingsTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_holdings",
    {
      description: "Get current portfolio holdings, optionally filtered by account, returning all positions with their current market values and quantities. Use this tool when an agent needs a snapshot of what is currently held in the portfolio — it is also a prerequisite for compute_rebalancing.",
      inputSchema: z.object({
        account_id: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ account_id }) => {
      try {
        const result = await useCases.getHoldings.execute(account_id);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

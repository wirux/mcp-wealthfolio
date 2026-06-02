import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetNetWorthUseCase } from "../../use-cases/get-net-worth.js";

interface UseCases {
  getNetWorth: GetNetWorthUseCase;
}

export function registerGetNetWorthTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_net_worth",
    {
      description: "Get the current net worth of the portfolio, aggregated across all accounts and converted to the base currency. Use this tool when an agent needs a single top-level figure for total portfolio value, or to track wealth over time.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const result = await useCases.getNetWorth.execute();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

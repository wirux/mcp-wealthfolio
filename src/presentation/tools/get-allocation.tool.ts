import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetAllocationUseCase } from "../../use-cases/get-allocation.js";

interface UseCases {
  getAllocation: GetAllocationUseCase;
}

export function registerGetAllocationTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_allocation",
    {
      description: "Get portfolio allocation breakdown by asset class, sector, and currency. Use this tool when an agent needs to understand how the portfolio is distributed across different categories, or to identify concentration risk before making investment decisions.",
      inputSchema: z.object({
        account_id: z.string().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ account_id }) => {
      try {
        const result = await useCases.getAllocation.execute(account_id);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetHoldingDetailUseCase } from "../../use-cases/get-holding-detail.js";

interface UseCases {
  getHoldingDetail: GetHoldingDetailUseCase;
}

export function registerGetHoldingDetailTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_holding_detail",
    {
      description: "Get detailed information for a specific holding by account and asset ID, including cost basis, unrealized gain/loss, and quantity. Use this tool when an agent needs granular data about a single position rather than a full portfolio overview.",
      inputSchema: z.object({
        account_id: z.string(),
        asset_id: z.string(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ account_id, asset_id }) => {
      try {
        const result = await useCases.getHoldingDetail.execute(account_id, asset_id);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

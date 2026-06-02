import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ListAccountsUseCase } from "../../use-cases/list-accounts.js";

interface UseCases {
  listAccounts: ListAccountsUseCase;
}

export function registerListAccountsTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "list_accounts",
    {
      description: "List all investment accounts in Wealthfolio, returning account IDs, names, and types. Use this tool first when an agent needs to discover available account IDs before calling account-scoped tools such as get_holdings or get_activities.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const result = await useCases.listAccounts.execute();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

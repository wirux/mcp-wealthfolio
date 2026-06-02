import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetHealthUseCase } from "../../use-cases/get-health.js";

interface UseCases {
  getHealth: GetHealthUseCase;
}

export function registerGetHealthTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_health",
    {
      description: "Check the health status of the Wealthfolio service to confirm it is reachable and operational. Use this tool as a first step when diagnosing connectivity issues or before running a sequence of data-fetching tools that depend on the service being available.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const result = await useCases.getHealth.execute();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

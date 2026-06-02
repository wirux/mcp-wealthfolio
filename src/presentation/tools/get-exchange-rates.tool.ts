import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetExchangeRatesUseCase } from "../../use-cases/get-exchange-rates.js";

interface UseCases {
  getExchangeRates: GetExchangeRatesUseCase;
}

export function registerGetExchangeRatesTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_exchange_rates",
    {
      description: "Get the current exchange rates used by the portfolio for currency conversion. Use this tool when an agent needs to understand multi-currency valuation, convert amounts between currencies, or diagnose discrepancies in portfolio value caused by FX rates.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const result = await useCases.getExchangeRates.execute();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

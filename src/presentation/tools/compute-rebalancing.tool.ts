import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ComputeRebalancingUseCase } from "../../use-cases/compute-rebalancing.js";
import type { GetHoldingsUseCase } from "../../use-cases/get-holdings.js";
import type { RebalancingPlan } from "../../domain/entities/rebalancing-plan.js";

interface UseCases {
  computeRebalancing: ComputeRebalancingUseCase;
  getHoldings: GetHoldingsUseCase;
}

function formatRebalancingPlan(plan: RebalancingPlan): object {
  const recommendations = plan.drifts.map((drift) => ({
    symbol: drift.symbol.value,
    currentWeight: parseFloat((drift.currentWeight.value * 100).toFixed(2)),
    targetWeight: parseFloat((drift.targetWeight.value * 100).toFixed(2)),
    driftPercent: parseFloat((drift.driftPercent * 100).toFixed(2)),
    action: drift.action,
    estimatedValue: parseFloat(drift.deltaValue.amount.toFixed(2)),
  }));

  return {
    totalValue: parseFloat(plan.totalValue.amount.toFixed(2)),
    currency: plan.totalValue.currency.code,
    cashRemaining: plan.cashToInvest !== undefined ? parseFloat(plan.cashToInvest.amount.toFixed(2)) : null,
    recommendations,
  };
}

export function registerComputeRebalancingTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "compute_rebalancing",
    {
      description: "Compute a portfolio rebalancing plan given target weights (as decimals summing to 1.0) and an optional cash amount to invest, returning a structured JSON object with per-symbol recommendations. Use this tool when an agent needs to determine which assets to buy or sell to align the portfolio with a target allocation; the result includes currentWeight, targetWeight, driftPercent, action, and estimatedValue for each symbol.",
      inputSchema: z.object({
        target_weights: z.record(z.string(), z.number()),
        account_id: z.string().optional(),
        cash_to_invest: z.number().nonnegative().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      try {
        const holdings = await useCases.getHoldings.execute(args.account_id);
        const params: Parameters<typeof useCases.computeRebalancing.execute>[0] = {
          holdings,
          targetWeights: args.target_weights,
        };
        if (args.cash_to_invest !== undefined) params.cashToInvest = args.cash_to_invest;

        const plan = useCases.computeRebalancing.execute(params);
        const result = formatRebalancingPlan(plan);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

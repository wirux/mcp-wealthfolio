import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ComputeRebalancingUseCase } from "../../use-cases/compute-rebalancing.js";
import type { GetHoldingsUseCase } from "../../use-cases/get-holdings.js";
import { registerComputeRebalancingTool } from "./compute-rebalancing.tool.js";
import type { RebalancingPlan } from "../../domain/entities/rebalancing-plan.js";

function createServer() {
  return new McpServer({ name: "test", version: "0.0.0" });
}

function getHandler(server: McpServer, toolName: string) {
  const tools = Reflect.get(server, "_registeredTools") as Record<
    string,
    { handler: (args: unknown) => Promise<unknown> }
  >;
  const tool = tools[toolName];
  if (!tool) throw new Error(`Tool ${toolName} not registered`);
  return tool.handler;
}

function makeMockPlan(drifts: Array<{
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  driftPercent: number;
  deltaValue: number;
  action: "buy" | "sell" | "hold";
  absoluteDrift: number;
}>, totalAmount = 10000): RebalancingPlan {
  return {
    drifts: drifts.map((d) => ({
      symbol: { value: d.symbol },
      currentWeight: { value: d.currentWeight },
      targetWeight: { value: d.targetWeight },
      driftPercent: d.driftPercent,
      deltaValue: { amount: d.deltaValue, currency: { code: "USD" } },
      action: d.action,
      absoluteDrift: d.absoluteDrift,
    })),
    totalValue: { amount: totalAmount, currency: { code: "USD" } },
    targetAllocation: {} as RebalancingPlan["targetAllocation"],
  } as unknown as RebalancingPlan;
}

describe("registerComputeRebalancingTool", () => {
  let server: McpServer;
  let mockComputeUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockGetHoldingsUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = createServer();
    mockComputeUseCase = { execute: vi.fn() };
    mockGetHoldingsUseCase = { execute: vi.fn().mockResolvedValue([]) };
    registerComputeRebalancingTool(server, {
      computeRebalancing: mockComputeUseCase as unknown as ComputeRebalancingUseCase,
      getHoldings: mockGetHoldingsUseCase as unknown as GetHoldingsUseCase,
    });
  });

  it("returns JSON with rebalancing recommendations on success", async () => {
    const plan = makeMockPlan([
      { symbol: "AAPL", currentWeight: 0.3, targetWeight: 0.5, driftPercent: 0.2, deltaValue: 2000, action: "buy", absoluteDrift: 0.2 },
    ]);
    mockComputeUseCase.execute.mockReturnValue(plan);

    const handler = getHandler(server, "compute_rebalancing");
    const response = await handler({ target_weights: { AAPL: 0.5 } }) as { content: Array<{ type: string; text: string }> };

    expect(response.content[0]?.type).toBe("text");
    const parsed = JSON.parse(response.content[0]?.text ?? "{}");
    expect(parsed).toHaveProperty("totalValue");
    expect(parsed).toHaveProperty("recommendations");
    expect(Array.isArray(parsed.recommendations)).toBe(true);
    const rec = parsed.recommendations[0];
    expect(rec).toHaveProperty("symbol", "AAPL");
    expect(rec).toHaveProperty("action", "buy");
    expect(rec).toHaveProperty("currentWeight");
    expect(rec).toHaveProperty("targetWeight");
    expect(rec).toHaveProperty("driftPercent");
    expect(rec).toHaveProperty("estimatedValue");
  });

  it("returns isError response when getHoldings throws", async () => {
    mockGetHoldingsUseCase.execute.mockRejectedValue(new Error("Holdings error"));

    const handler = getHandler(server, "compute_rebalancing");
    const response = await handler({ target_weights: { AAPL: 1.0 } });

    expect(response).toEqual({
      content: [{ type: "text", text: "Holdings error" }],
      isError: true,
    });
  });

  it("passes account_id to getHoldings", async () => {
    const plan = makeMockPlan([]);
    mockComputeUseCase.execute.mockReturnValue(plan);

    const handler = getHandler(server, "compute_rebalancing");
    await handler({ target_weights: {}, account_id: "acc1" });

    expect(mockGetHoldingsUseCase.execute).toHaveBeenCalledWith("acc1");
  });

  it("registers the tool with readOnlyHint annotation", () => {
    const tools = Reflect.get(server, "_registeredTools") as Record<
      string,
      { annotations?: { readOnlyHint?: boolean } }
    >;
    expect(tools["compute_rebalancing"]?.annotations?.readOnlyHint).toBe(true);
  });
});

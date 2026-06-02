import { Drift } from "../domain/entities/drift.js";
import type { Holding } from "../domain/entities/holding.js";
import { RebalancingPlan } from "../domain/entities/rebalancing-plan.js";
import { TargetAllocation } from "../domain/entities/target-allocation.js";
import { ValidationError } from "../domain/errors/validation-error.js";
import { AssetSymbol } from "../domain/value-objects/asset-symbol.js";
import { Currency } from "../domain/value-objects/currency.js";
import { Money } from "../domain/value-objects/money.js";
import { Percentage } from "../domain/value-objects/percentage.js";

export class ComputeRebalancingUseCase {
  execute(params: {
    holdings: Holding[];
    targetWeights: Record<string, number>;
    cashToInvest?: number;
  }): RebalancingPlan {
    const { holdings, targetWeights, cashToInvest } = params;

    if (cashToInvest !== undefined && cashToInvest < 0) {
      throw new ValidationError("cashToInvest must be non-negative");
    }

    const targetAllocation = TargetAllocation.create(targetWeights);
    const currency = holdings[0]?.marketValue.currency ?? Currency.create("USD");
    const holdingsTotal = holdings.reduce(
      (sum, holding) => sum + holding.marketValue.amount,
      0,
    );
    const totalValue = cashToInvest !== undefined && cashToInvest > 0
      ? holdingsTotal + cashToInvest
      : holdingsTotal;

    if (totalValue === 0) {
      return RebalancingPlan.create({
        drifts: [],
        totalValue: Money.of(0, currency),
        targetAllocation,
      });
    }

    const symbols = new Set<string>([
      ...Object.keys(targetWeights),
      ...holdings.map((holding) => holding.symbol.value),
    ]);

    const drifts: Drift[] = [];
    const positiveDriftPercents = new Map<string, number>();

    if (cashToInvest !== undefined && cashToInvest > 0) {
      for (const symbol of symbols) {
        const holdingValue = holdings.find((holding) => holding.symbol.value === symbol)?.marketValue.amount ?? 0;
        const currentWeight = holdingValue / totalValue;
        const targetWeight = targetWeights[symbol] ?? 0;
        const driftPercent = targetWeight - currentWeight;

        if (driftPercent > 0) {
          positiveDriftPercents.set(symbol, driftPercent);
        }
      }

      const totalPositiveDrift = Array.from(positiveDriftPercents.values()).reduce(
        (sum, driftPercent) => sum + driftPercent,
        0,
      );

      if (totalPositiveDrift > 0) {
        for (const symbol of symbols) {
          const positiveDrift = positiveDriftPercents.get(symbol);

          if (positiveDrift === undefined) {
            continue;
          }

          const holdingValue = holdings.find((holding) => holding.symbol.value === symbol)?.marketValue.amount ?? 0;
          const currentWeight = holdingValue / totalValue;
          const targetWeight = targetWeights[symbol] ?? 0;
          const deltaValue = cashToInvest * (positiveDrift / totalPositiveDrift);

          drifts.push(Drift.create({
            symbol: AssetSymbol.create(symbol),
            currentWeight: Percentage.create(currentWeight),
            targetWeight: Percentage.create(targetWeight),
            deltaValue: Money.of(deltaValue, currency),
          }));
        }
      }
    } else {
      for (const symbol of symbols) {
        const holdingValue = holdings.find((holding) => holding.symbol.value === symbol)?.marketValue.amount ?? 0;
        const currentWeight = holdingValue / totalValue;
        const targetWeight = targetWeights[symbol] ?? 0;
        const driftPercent = targetWeight - currentWeight;
        const deltaValue = driftPercent * totalValue;

        drifts.push(Drift.create({
          symbol: AssetSymbol.create(symbol),
          currentWeight: Percentage.create(currentWeight),
          targetWeight: Percentage.create(targetWeight),
          deltaValue: Money.of(deltaValue, currency),
        }));
      }
    }

    return RebalancingPlan.create({
      drifts,
      totalValue: Money.of(totalValue, currency),
      targetAllocation,
    });
  }
}

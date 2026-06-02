import type { WealthfolioReadGateway, ActivitySearchResult } from "../domain/ports/wealthfolio-gateway.js";
import type { ActivitySearchCriteria } from "../domain/entities/activity-search-criteria.js";

export class GetActivitiesUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(criteria: ActivitySearchCriteria): Promise<ActivitySearchResult> {
    return this.gateway.searchActivities(criteria);
  }
}

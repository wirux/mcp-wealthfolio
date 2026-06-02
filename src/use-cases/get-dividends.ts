import type { WealthfolioReadGateway, ActivitySearchResult } from "../domain/ports/wealthfolio-gateway.js";
import { ActivitySearchCriteria } from "../domain/entities/activity-search-criteria.js";

export interface GetDividendsParams {
  accountId?: string;
  year?: number;
}

export class GetDividendsUseCase {
  constructor(private readonly gateway: WealthfolioReadGateway) {}

  async execute(params: GetDividendsParams): Promise<ActivitySearchResult> {
    const props: Parameters<typeof ActivitySearchCriteria.create>[0] = {
      activityTypeFilter: ["DIVIDEND"],
    };

    if (params.accountId !== undefined) {
      props.accountIdFilter = [params.accountId];
    }

    if (params.year !== undefined) {
      props.dateFrom = `${params.year}-01-01`;
      props.dateTo = `${params.year}-12-31`;
    }

    const criteria = ActivitySearchCriteria.create(props);
    return this.gateway.searchActivities(criteria);
  }
}

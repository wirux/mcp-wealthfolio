import { ValidationError } from "../errors/validation-error.js";
import { ActivityType } from "./activity-type.js";

export type SortDirection = "asc" | "desc";

export interface ActivitySortField {
  field: "date" | "activityType" | "symbol" | "totalAmount";
  direction: SortDirection;
}

export interface ActivitySearchCriteriaProps {
  accountIdFilter?: string[];
  activityTypeFilter?: ActivityType[];
  assetIdKeyword?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sort?: ActivitySortField;
}

export class ActivitySearchCriteria {
  readonly accountIdFilter?: string[];
  readonly activityTypeFilter?: ActivityType[];
  readonly assetIdKeyword?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: ActivitySortField;

  private constructor(props: ActivitySearchCriteriaProps) {
    if (props.accountIdFilter !== undefined) this.accountIdFilter = props.accountIdFilter;
    if (props.activityTypeFilter !== undefined) this.activityTypeFilter = props.activityTypeFilter;
    if (props.assetIdKeyword !== undefined) this.assetIdKeyword = props.assetIdKeyword;
    if (props.dateFrom !== undefined) this.dateFrom = props.dateFrom;
    if (props.dateTo !== undefined) this.dateTo = props.dateTo;
    this.page = props.page ?? 1;
    this.pageSize = props.pageSize ?? 20;
    if (props.sort !== undefined) this.sort = props.sort;
  }

  static create(props: ActivitySearchCriteriaProps = {}): ActivitySearchCriteria {
    if (props.page !== undefined && props.page < 1) {
      throw new ValidationError("Page must be >= 1", "page");
    }
    if (props.pageSize !== undefined && props.pageSize < 1) {
      throw new ValidationError("PageSize must be >= 1", "pageSize");
    }
    return new ActivitySearchCriteria(props);
  }
}

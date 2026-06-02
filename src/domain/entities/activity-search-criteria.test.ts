import { describe, it, expect } from "vitest";
import { ActivitySearchCriteria } from "./activity-search-criteria.js";
import { ValidationError } from "../errors/validation-error.js";

describe("ActivitySearchCriteria", () => {
  it("creates with defaults when no props given", () => {
    const c = ActivitySearchCriteria.create();
    expect(c.page).toBe(1);
    expect(c.pageSize).toBe(20);
    expect(c.accountIdFilter).toBeUndefined();
    expect(c.activityTypeFilter).toBeUndefined();
    expect(c.assetIdKeyword).toBeUndefined();
    expect(c.dateFrom).toBeUndefined();
    expect(c.dateTo).toBeUndefined();
    expect(c.sort).toBeUndefined();
  });

  it("creates with all optional fields", () => {
    const c = ActivitySearchCriteria.create({
      accountIdFilter: ["acc-1", "acc-2"],
      activityTypeFilter: ["BUY", "SELL"],
      assetIdKeyword: "AAPL",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
      page: 2,
      pageSize: 50,
      sort: { field: "date", direction: "desc" },
    });
    expect(c.accountIdFilter).toEqual(["acc-1", "acc-2"]);
    expect(c.activityTypeFilter).toEqual(["BUY", "SELL"]);
    expect(c.assetIdKeyword).toBe("AAPL");
    expect(c.dateFrom).toBe("2024-01-01");
    expect(c.dateTo).toBe("2024-12-31");
    expect(c.page).toBe(2);
    expect(c.pageSize).toBe(50);
    expect(c.sort).toEqual({ field: "date", direction: "desc" });
  });

  it("throws ValidationError when page < 1", () => {
    expect(() => ActivitySearchCriteria.create({ page: 0 })).toThrow(ValidationError);
  });

  it("throws ValidationError when pageSize < 1", () => {
    expect(() => ActivitySearchCriteria.create({ pageSize: 0 })).toThrow(ValidationError);
  });

  it("ValidationError field is 'page'", () => {
    try {
      ActivitySearchCriteria.create({ page: -1 });
    } catch (e) {
      expect((e as ValidationError).field).toBe("page");
    }
  });

  it("ValidationError field is 'pageSize'", () => {
    try {
      ActivitySearchCriteria.create({ pageSize: -5 });
    } catch (e) {
      expect((e as ValidationError).field).toBe("pageSize");
    }
  });

  it("page=1 is valid", () => {
    const c = ActivitySearchCriteria.create({ page: 1 });
    expect(c.page).toBe(1);
  });

  it("pageSize=1 is valid", () => {
    const c = ActivitySearchCriteria.create({ pageSize: 1 });
    expect(c.pageSize).toBe(1);
  });
});

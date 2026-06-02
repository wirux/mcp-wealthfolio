import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetActivitiesUseCase } from "../../use-cases/get-activities.js";
import { ActivitySearchCriteria } from "../../domain/entities/activity-search-criteria.js";
import type { ActivityType } from "../../domain/entities/activity-type.js";

interface UseCases {
  getActivities: GetActivitiesUseCase;
}

export function registerGetActivitiesTool(server: McpServer, useCases: UseCases): void {
  server.registerTool(
    "get_activities",
    {
      description: "Search and list portfolio activities (transactions) with optional filters. Returns paginated transaction records including buys, sells, dividends, and other activity types — use this tool when an agent needs to audit trade history, reconcile transactions, or analyze activity patterns for a specific account or symbol.",
      inputSchema: z.object({
        account_id: z.string().optional(),
        activity_types: z.array(z.string()).optional(),
        symbol_keyword: z.string().optional(),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
        page: z.number().int().positive().optional(),
        page_size: z.number().int().positive().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      try {
        const props: Parameters<typeof ActivitySearchCriteria.create>[0] = {};
        if (args.account_id !== undefined) props.accountIdFilter = [args.account_id];
        if (args.activity_types !== undefined) props.activityTypeFilter = args.activity_types as ActivityType[];
        if (args.symbol_keyword !== undefined) props.assetIdKeyword = args.symbol_keyword;
        if (args.date_from !== undefined) props.dateFrom = args.date_from;
        if (args.date_to !== undefined) props.dateTo = args.date_to;
        if (args.page !== undefined) props.page = args.page;
        if (args.page_size !== undefined) props.pageSize = args.page_size;

        const criteria = ActivitySearchCriteria.create(props);
        const result = await useCases.getActivities.execute(criteria);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}

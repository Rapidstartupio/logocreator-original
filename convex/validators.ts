import { v } from "convex/values";

// Pagination validator for queries that support pagination
export const paginationOptsValidator = v.object({
  numItems: v.optional(v.number()),
  cursor: v.optional(v.string()),
});

export type PaginationOpts = {
  numItems?: number;
  cursor?: string;
};

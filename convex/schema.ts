import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  logoHistory: defineTable({
    userId: v.string(),
    companyName: v.string(),
    layout: v.string(),
    style: v.string(),
    primaryColor: v.string(),
    backgroundColor: v.string(),
    additionalInfo: v.optional(v.string()),
    images: v.array(v.string()),
    timestamp: v.number()
  }).index("by_user", ["userId"])
}); 
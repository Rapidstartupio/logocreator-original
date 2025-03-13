import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  logoHistory: defineTable({
    userId: v.optional(v.string()),
    companyName: v.string(),
    layout: v.string(),
    style: v.string(),
    primaryColor: v.string(),
    backgroundColor: v.string(),
    additionalInfo: v.optional(v.string()),
    images: v.array(v.string()),
    timestamp: v.number(),
    businessType: v.optional(v.string()),
    prompt: v.optional(v.string()),
    styleDetails: v.optional(v.string()),
    layoutDetails: v.optional(v.string()),
    numberOfImages: v.optional(v.number()),
    isDemo: v.optional(v.boolean()),
    generationTime: v.optional(v.number()),
    modelUsed: v.optional(v.string()),
    status: v.optional(v.string()),
    errorMessage: v.optional(v.string())
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_style", ["style"])
    .index("by_layout", ["layout"])
    .index("by_status", ["status"]),

  userAnalytics: defineTable({
    userId: v.string(),
    email: v.string(),
    totalLogosGenerated: v.number(),
    lastActive: v.number(),
    lastCompanyName: v.string(),
    lastBusinessType: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    credits: v.optional(v.number()),
  }).index("by_user", ["userId"])
  .index("by_lastActive", ["lastActive"])
  .index("by_totalLogos", ["totalLogosGenerated"])
}); 
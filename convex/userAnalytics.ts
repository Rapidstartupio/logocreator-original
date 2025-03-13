import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateUserAnalytics = mutation({
  args: {
    email: v.string(),
    companyName: v.optional(v.string()),
    businessType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called updateUserAnalytics without authentication present");
    }

    // Find existing user analytics
    const existingAnalytics = await ctx.db
      .query("userAnalytics")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existingAnalytics) {
      // Update existing analytics
      await ctx.db.patch(existingAnalytics._id, {
        totalLogosGenerated: existingAnalytics.totalLogosGenerated + 1,
        lastActive: Date.now(),
        lastCompanyName: args.companyName || existingAnalytics.lastCompanyName,
        lastBusinessType: args.businessType || existingAnalytics.lastBusinessType,
      });
    } else {
      // Create new analytics
      await ctx.db.insert("userAnalytics", {
        userId: identity.subject,
        email: args.email,
        totalLogosGenerated: 1,
        lastActive: Date.now(),
        lastCompanyName: args.companyName || "Unknown",
        lastBusinessType: args.businessType || "Unknown",
      });
    }
  },
}); 
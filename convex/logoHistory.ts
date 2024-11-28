import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    companyName: v.string(),
    layout: v.string(),
    style: v.string(),
    primaryColor: v.string(),
    backgroundColor: v.string(),
    additionalInfo: v.optional(v.string()),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called save without authentication present");
    }
    
    return await ctx.db.insert("logoHistory", {
      userId: identity.subject,
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    return await ctx.db
      .query("logoHistory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(50);
  },
}); 
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called save without authentication present");
    }
    
    const logoData = {
      userId: identity.subject,
      ...args,
      timestamp: Date.now(),
      status: args.status || "success",
      numberOfImages: args.numberOfImages || args.images.length,
      isDemo: args.isDemo || false
    };

    const savedId = await ctx.db.insert("logoHistory", logoData);

    const userAnalytics = await ctx.db
      .query("userAnalytics")
      .withIndex("by_user", q => q.eq("userId", identity.subject))
      .first();

    if (userAnalytics) {
      await ctx.db.patch(userAnalytics._id, {
        totalLogosGenerated: (userAnalytics.totalLogosGenerated || 0) + 1,
        lastActive: Date.now(),
        lastCompanyName: args.companyName,
        lastBusinessType: args.businessType
      });
    }

    return savedId;
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

export const getByStyle = query({
  args: { style: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    return await ctx.db
      .query("logoHistory")
      .withIndex("by_style", (q) => q.eq("style", args.style))
      .order("desc")
      .take(50);
  },
});

export const getByLayout = query({
  args: { layout: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    return await ctx.db
      .query("logoHistory")
      .withIndex("by_layout", (q) => q.eq("layout", args.layout))
      .order("desc")
      .take(50);
  },
});

export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    return await ctx.db
      .query("logoHistory")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(50);
  },
}); 
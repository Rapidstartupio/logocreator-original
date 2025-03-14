import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Initialize a new user in the userAnalytics table
export const initializeUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("userAnalytics")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (existingUser) {
      return existingUser;
    }

    // Create new user with default values
    return await ctx.db.insert("userAnalytics", {
      userId: args.userId,
      email: args.email,
      totalLogosGenerated: 0,
      lastActive: Date.now(),
      lastCompanyName: "",
      lastBusinessType: "",
      isAdmin: args.isAdmin || false,
      credits: 100, // Default credits for new users
    });
  }
});

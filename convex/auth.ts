import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Transfer demo logos to a user's account
 */
export const transferDemoLogos = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<number> => {
    // Check if user already exists in userAnalytics
    const existingAnalytics = await ctx.db
      .query("userAnalytics")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    // If user already exists, they've already had their demos transferred
    if (existingAnalytics) {
      return 0;
    }

    // Find all demo logos without a userId (created in the last 24 hours)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // First try to find logos with isDemo = true
    let demoLogos = await ctx.db
      .query("logoHistory")
      .filter(q => q.and(
        q.eq(q.field("isDemo"), true),
        q.gt(q.field("timestamp"), twentyFourHoursAgo)
      ))
      .collect();

    // If no demo logos found with isDemo flag, try to find any recent logos without a userId
    if (demoLogos.length === 0) {
      demoLogos = await ctx.db
        .query("logoHistory")
        .filter(q => q.and(
          q.or(
            q.eq(q.field("userId"), ""),
            q.eq(q.field("userId"), undefined),
            q.eq(q.field("userId"), null)
          ),
          q.gt(q.field("timestamp"), twentyFourHoursAgo)
        ))
        .collect();
    }

    // Update each demo logo with the user's ID if any were found
    if (demoLogos.length > 0) {
      for (const logo of demoLogos) {
        await ctx.db.patch(logo._id, { 
          userId: args.userId,
          isDemo: false // Mark as no longer a demo
        });
      }
    }

    // Always create user analytics entry for new users, even if no demos to transfer
    await ctx.db.insert("userAnalytics", {
      userId: args.userId,
      email: args.email,
      totalLogosGenerated: demoLogos.length,
      lastActive: Date.now(),
      lastCompanyName: demoLogos[0]?.companyName || "",
      lastBusinessType: demoLogos[0]?.businessType || undefined,
      credits: 5 // Start with 5 free credits for new users
    });

    return demoLogos.length;
  }
}); 
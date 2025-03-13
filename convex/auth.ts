import { v } from "convex/values";
import { mutation } from "./_generated/server";

// ... existing code ...

export const transferDemoLogos = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all demo logos without a userId (created in the last 24 hours)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const demoLogos = await ctx.db
      .query("logoHistory")
      .filter(q => q.and(
        q.eq(q.field("isDemo"), true),
        q.or(
          q.eq(q.field("userId"), ""),
          q.eq(q.field("userId"), undefined)
        ),
        q.gt(q.field("timestamp"), twentyFourHoursAgo)
      ))
      .collect();

    // Update each demo logo with the user's ID
    for (const logo of demoLogos) {
      await ctx.db.patch(logo._id, { userId: args.userId });
    }

    // Create or update user analytics
    const existingAnalytics = await ctx.db
      .query("userAnalytics")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingAnalytics) {
      await ctx.db.patch(existingAnalytics._id, {
        totalLogosGenerated: existingAnalytics.totalLogosGenerated + demoLogos.length,
        lastActive: Date.now(),
        email: args.email,
        credits: (existingAnalytics.credits || 0) + 5 // Give 5 free credits on sign-up
      });
    } else {
      await ctx.db.insert("userAnalytics", {
        userId: args.userId,
        email: args.email,
        totalLogosGenerated: demoLogos.length,
        lastActive: Date.now(),
        lastCompanyName: demoLogos[0]?.companyName || "",
        lastBusinessType: demoLogos[0]?.businessType || undefined,
        credits: 5 // Start with 5 free credits
      });
    }

    return demoLogos.length;
  }
}); 
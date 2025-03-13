import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function for admin checks
const checkAdmin = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  
  if (!identity) {
    throw new Error("No user identity found");
  }

  // Get email from tokenIdentifier or email field
  const userEmail = identity.email || identity.tokenIdentifier.split("|")[1];
  const isAdmin = userEmail === "admin@admin.com";

  if (!isAdmin) {
    throw new Error("Unauthorized access to admin functions");
  }

  return identity;
};

export const getAllUsers = query({
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db
      .query("userAnalytics")
      .withIndex("by_lastActive")
      .collect();
  },
});

export const getRecentLogos = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db
      .query("logoHistory")
      .withIndex("by_timestamp")
      .order("desc")
      .take(50);
  },
});

export const getDailyStats = query({
  handler: async (ctx) => {
    await checkAdmin(ctx);
    
    const oneDayAgo = Date.now();
    
    // Get active users in last 24h
    const activeUsers = await ctx.db
      .query("userAnalytics")
      .withIndex("by_lastActive")
      .filter(q => q.gte(q.field("lastActive"), oneDayAgo - 24 * 60 * 60 * 1000))
      .collect();

    // Get logos generated in last 24h
    const recentLogos = await ctx.db
      .query("logoHistory")
      .withIndex("by_timestamp")
      .filter(q => q.gte(q.field("timestamp"), oneDayAgo - 24 * 60 * 60 * 1000))
      .collect();

    return {
      activeUsers: activeUsers.length,
      totalLogos: recentLogos.length,
      timestamp: oneDayAgo
    };
  },
});

export const syncClerkUsers = mutation({
  args: {
    usersData: v.array(
      v.object({
        userId: v.string(),
        email: v.string(),
        isAdmin: v.boolean(),
      })
    ),
    adminKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Check either admin key or user identity
    const identity = await ctx.auth.getUserIdentity();
    const isAdmin = identity?.email === "admin@admin.com" || 
                   args.adminKey === (process.env.CONVEX_ADMIN_KEY || 'dev_admin');
    
    if (!isAdmin) {
      throw new Error("Unauthorized access to admin functions");
    }

    try {
      let userCount = 0;
      for (const userData of args.usersData) {
        const { userId, email } = userData;
        
        const existingUser = await ctx.db
          .query("userAnalytics")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        
        if (!existingUser) {
          await ctx.db.insert("userAnalytics", {
            userId,
            email,
            totalLogosGenerated: 0,
            lastActive: Date.now(),
            lastCompanyName: "Unknown",
            lastBusinessType: "Unknown",
          });
          userCount++;
        }
      }
      
      return { success: true, userCount };
    } catch (error) {
      console.error("Error syncing users:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const getUsersWithLogoData = query({
  handler: async (ctx) => {
    await checkAdmin(ctx);
    
    // Get all users with their analytics
    const users = await ctx.db
      .query("userAnalytics")
      .withIndex("by_lastActive")
      .order("desc")
      .collect();
    
    // Get the most recent logo for each user
    const userLogos = await Promise.all(
      users.map(async (user) => {
        const lastLogo = await ctx.db
          .query("logoHistory")
          .withIndex("by_user")
          .filter(q => q.eq("userId", user.userId))
          .order("desc")
          .first();
        
        return {
          ...user,
          lastLogoTimestamp: lastLogo?.timestamp || null
        };
      })
    );
    
    return userLogos;
  },
});

// New function to add sample logo data
export const createSampleLogo = mutation({
  args: {
    userId: v.string(),
    companyName: v.string(),
    businessType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);

    const styles = ["modern", "minimal", "classic", "bold", "playful"];
    const layouts = ["centered", "minimal", "dynamic", "balanced", "geometric"];
    const colors = ["#4B5563", "#1E40AF", "#047857", "#B91C1C", "#6D28D9"];
    const bgColors = ["#F9FAFB", "#EFF6FF", "#ECFDF5", "#FEF2F2", "#F5F3FF"];

    // Create a simple base64 placeholder image
    const createPlaceholderImage = () => {
      // This is a 1x1 transparent pixel in base64
      return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    };

    // Create multiple sample logos with different timestamps
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const logoPromises = Array.from({ length: 5 }).map(async (_, index) => {
      const timestamp = now - (index * oneDay); // Spread over last 5 days
      const style = styles[index % styles.length];
      const layout = layouts[index % layouts.length];
      const color = colors[index % colors.length];
      const bgColor = bgColors[index % bgColors.length];

      return await ctx.db.insert("logoHistory", {
        userId: args.userId,
        companyName: `${args.companyName} - ${style}`,
        layout,
        style,
        primaryColor: color,
        backgroundColor: bgColor,
        additionalInfo: `Sample logo ${index + 1} created for testing`,
        images: [
          createPlaceholderImage(),
          createPlaceholderImage(),
        ],
        timestamp
      });
    });

    const logoIds = await Promise.all(logoPromises);

    // Update user analytics
    const existingAnalytics = await ctx.db
      .query("userAnalytics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingAnalytics) {
      await ctx.db.patch(existingAnalytics._id, {
        totalLogosGenerated: existingAnalytics.totalLogosGenerated + logoPromises.length,
        lastActive: now,
        lastCompanyName: args.companyName,
        lastBusinessType: args.businessType || existingAnalytics.lastBusinessType,
      });
    }

    return { success: true, logoIds };
  },
});

// New function to get all tables in the database
export const getAllTables = query({
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return ["logoHistory", "userAnalytics"];
  },
});

// Function to get all data from a specific table
export const getAllTableData = query({
  args: {
    tableName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    const limit = args.limit || 100;
    
    if (args.tableName === "logoHistory") {
      return await ctx.db
        .query("logoHistory")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    } else if (args.tableName === "userAnalytics") {
      return await ctx.db
        .query("userAnalytics")
        .withIndex("by_lastActive")
        .order("desc")
        .take(limit);
    }
    
    throw new Error(`Unknown table: ${args.tableName}`);
  },
});

export const testAdminAccess = query({
  handler: async (ctx) => {
    await checkAdmin(ctx);
    
    // Count total records
    const users = await ctx.db.query("userAnalytics").collect();
    const logos = await ctx.db.query("logoHistory").collect();
    const recordCount = users.length + logos.length;
    
    const identity = await ctx.auth.getUserIdentity();
    
    return {
      success: true,
      userIdentity: { email: identity?.email },
      recordCount,
      adminKeyPresent: true
    };
  },
}); 
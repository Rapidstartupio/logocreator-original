import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Test connection and auth status
export const testConnection = query({
  handler: async (ctx) => {
    console.log("🔍 Testing Convex connection...");
    try {
      const identity = await ctx.auth.getUserIdentity();
      console.log("📡 Connection test results:", {
        connected: true,
        hasIdentity: !!identity,
        identityDetails: identity,
        timestamp: new Date().toISOString()
      });
      return {
        success: true,
        identity,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      return {
        success: false,
        error: String(error),
        timestamp: Date.now()
      };
    }
  }
});

export const getAllUsers = query({
  handler: async (ctx) => {
    console.log("📥 getAllUsers: Starting request...");
    try {
      const users = await ctx.db
        .query("userAnalytics")
        .withIndex("by_lastActive")
        .collect();
      console.log("📤 getAllUsers: Success", { userCount: users.length });
      return users;
    } catch (error) {
      console.error("❌ getAllUsers: Error", error);
      throw error;
    }
  },
});

export const getRecentLogos = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("📥 getRecentLogos: Starting request...", { limit: args.limit });
    try {
      const logos = await ctx.db
        .query("logoHistory")
        .withIndex("by_timestamp")
        .order("desc")
        .take(50);
      console.log("📤 getRecentLogos: Success", { logoCount: logos.length });
      return logos;
    } catch (error) {
      console.error("❌ getRecentLogos: Error", error);
      throw error;
    }
  },
});

export const getDailyStats = query({
  handler: async (ctx) => {
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

export const createSampleLogo = mutation({
  args: {
    userId: v.string(),
    companyName: v.string(),
    businessType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const styles = ["modern", "minimal", "classic", "bold", "playful"];
    const layouts = ["centered", "minimal", "dynamic", "balanced", "geometric"];
    const colors = ["#4B5563", "#1E40AF", "#047857", "#B91C1C", "#6D28D9"];
    const bgColors = ["#F9FAFB", "#EFF6FF", "#ECFDF5", "#FEF2F2", "#F5F3FF"];

    const createPlaceholderImage = () => {
      return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    };

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const logoPromises = Array.from({ length: 5 }).map(async (_, index) => {
      const timestamp = now - (index * oneDay);
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
        images: [createPlaceholderImage(), createPlaceholderImage()],
        timestamp
      });
    });

    const logoIds = await Promise.all(logoPromises);

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

export const getAllTables = query({
  handler: async () => {
    return ["logoHistory", "userAnalytics"];
  },
});

export const getAllTableData = query({
  args: {
    tableName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
    console.log("🔑 testAdminAccess: Starting admin access test...");
    try {
      const identity = await ctx.auth.getUserIdentity();
      console.log("👤 User identity:", identity);

      const users = await ctx.db.query("userAnalytics").collect();
      console.log("📊 Users count:", users.length);

      const logos = await ctx.db.query("logoHistory").collect();
      console.log("🎨 Logos count:", logos.length);

      const result = {
        success: true,
        userIdentity: identity,
        recordCount: users.length + logos.length,
        adminKeyPresent: true,
        timestamp: Date.now()
      };

      console.log("✅ testAdminAccess: Success", result);
      return result;
    } catch (error) {
      console.error("❌ testAdminAccess: Error", error);
      throw error;
    }
  },
}); 
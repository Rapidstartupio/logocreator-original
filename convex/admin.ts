import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx } from "./_generated/server";

// Helper function to log debug info with type safety
function logDebug(context: string, data: Record<string, unknown>) {
  console.log(`[DEBUG][${context}]`, JSON.stringify({
    context,
    timestamp: Date.now(),
    data
  }, null, 2));
}

// Helper function to ensure user is admin
async function ensureAdminUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  logDebug("ensureAdminUser.identity", { identity });

  if (!identity) {
    throw new Error("Authentication required");
  }

  const user = await ctx.db
    .query("userAnalytics")
    .filter(q => q.eq(q.field("userId"), identity.subject))
    .first();

  logDebug("ensureAdminUser.user", { user });

  if (!user?.isAdmin) {
    throw new Error("Admin access required");
  }

  return user;
}

// Initialize a new user in userAnalytics
export const initializeUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    logDebug("initializeUser.args", args);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("userAnalytics")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
    
    logDebug("initializeUser.existingUser", { existingUser });

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user with default values
    const newUser = {
      userId: args.userId,
      email: args.email,
      totalLogosGenerated: 0,
      lastActive: Date.now(),
      lastCompanyName: "",
      lastBusinessType: "",
      isAdmin: args.isAdmin || false,
      credits: 100, // Default credits
    };

    logDebug("initializeUser.newUser", { newUser });
    const id = await ctx.db.insert("userAnalytics", newUser);
    logDebug("initializeUser.result", { id });
    return id;
  }
});

// Get all user statistics
export const getUserStats = query({
  handler: async (ctx) => {
    try {
      logDebug("getUserStats.start", { timestamp: Date.now() });
      
      // Ensure user is admin
      await ensureAdminUser(ctx);

      // Get all users
      const users = await ctx.db.query("userAnalytics").collect();
      logDebug("getUserStats.allUsers", { count: users.length });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      // Calculate stats
      const stats = {
        totalUsers: users.length,
        activeUsersToday: users.filter(u => u.lastActive > todayTimestamp).length,
        newUsersToday: users.filter(u => u._creationTime > todayTimestamp).length,
        totalLogosGenerated: users.reduce((sum, u) => sum + (u.totalLogosGenerated || 0), 0)
      };

      logDebug("getUserStats.stats", stats);

      // Map users to simplified format
      const mappedUsers = users.map(u => ({
        id: u.userId,
        email: u.email,
        firstName: u.lastBusinessType || "",
        totalLogosGenerated: u.totalLogosGenerated || 0,
        credits: u.credits || 0,
        isAdmin: u.isAdmin || false,
        createdAt: u._creationTime,
        lastActive: u.lastActive || null
      }));

      logDebug("getUserStats.mappedUsers", { count: mappedUsers.length });

      return {
        success: true,
        stats,
        users: mappedUsers
      };
    } catch (error) {
      console.error("[getUserStats] Error:", error);
      logDebug("getUserStats.error", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
});

// Get recent logos with user data
export const getRecentLogos = query({
  handler: async (ctx) => {
    try {
      logDebug("getRecentLogos.start", { timestamp: Date.now() });
      
      // Ensure user is admin
      await ensureAdminUser(ctx);

      // Get recent logos
      const logos = await ctx.db
        .query("logoHistory")
        .order("desc")
        .take(50);

      logDebug("getRecentLogos.logos", { count: logos.length });

      // Get user data for each logo
      const userIds = Array.from(new Set(logos.map(logo => logo.userId).filter(Boolean)));
      logDebug("getRecentLogos.userIds", { count: userIds.length, ids: userIds });

      const users = await Promise.all(
        userIds.map(id =>
          ctx.db
            .query("userAnalytics")
            .filter(q => q.eq(q.field("userId"), id))
            .first()
        )
      );

      logDebug("getRecentLogos.users", { 
        count: users.length,
        nullCount: users.filter(u => u === null).length 
      });

      // Create user lookup map
      const userMap = new Map(
        users
          .filter((u): u is NonNullable<typeof u> => u !== null)
          .map(u => [u.userId, u])
      );

      logDebug("getRecentLogos.userMap", { size: userMap.size });

      // Map logos with user data
      const data = logos.map(logo => ({
        id: logo._id,
        companyName: logo.companyName,
        images: logo.images,
        timestamp: logo._creationTime,
        status: logo.status || "unknown",
        style: logo.style,
        layout: logo.layout,
        businessType: logo.businessType,
        prompt: logo.prompt,
        additionalInfo: logo.additionalInfo,
        generationTime: logo.generationTime,
        modelUsed: logo.modelUsed,
        userEmail: userMap.get(logo.userId || "")?.email || "Unknown"
      }));

      logDebug("getRecentLogos.mappedData", { count: data.length });

      return { success: true, data };
    } catch (error) {
      console.error("[getRecentLogos] Error:", error);
      logDebug("getRecentLogos.error", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
});

// Get all users from userAnalytics table
export const getAllUsers = query({
  handler: async (ctx) => {
    try {
      console.log("[getAllUsers] Starting query execution");
      
      // Check authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return {
          success: false,
          error: "Authentication required",
          data: [],
          identity: null
        };
      }

      // Ensure user is admin
      const adminCheck = await ensureAdminUser(ctx);
      if (!adminCheck) {
        return {
          success: false,
          error: "Admin access required",
          data: [],
          identity: null
        };
      }

      // Query userAnalytics table
      const users = await ctx.db
        .query("userAnalytics")
        .collect();

      return {
        success: true,
        data: users,
        identity: {
          subject: identity.subject,
          tokenIdentifier: identity.tokenIdentifier
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[getAllUsers] Error:", error);
      return {
        success: false,
        error: `User query failed: ${error.message}`,
        data: [],
        identity: null
      };
    }
  }
});

// Simplest possible test query
export const testQuery = query({
  handler: async (ctx) => {
    try {
      // Log deployment info
      console.log("[testQuery] Starting query execution");
      console.log("[testQuery] Environment:", process.env.NODE_ENV);
      
      // Check authentication
      console.log("[testQuery] Checking authentication...");
      const identity = await ctx.auth.getUserIdentity();
      console.log("[testQuery] Auth result:", identity ? "Authenticated" : "Not authenticated");
      
      if (!identity) {
        return {
          success: false,
          error: "Authentication required",
          message: "",
          timestamp: Date.now(),
          identity: null
        };
      }

      return {
        success: true,
        message: "Basic query works",
        timestamp: Date.now(),
        identity: {
          subject: identity.subject,
          tokenIdentifier: identity.tokenIdentifier
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[testQuery] Error type:", error.constructor.name);
      console.error("[testQuery] Error message:", error.message);
      console.error("[testQuery] Error stack:", error.stack);
      return {
        success: false,
        error: `Query failed: ${error.message}`,
        message: "",
        timestamp: Date.now(),
        identity: null
      };
    }
  }
});

// Simple database test
export const testDbAccess = query({
  handler: async (ctx) => {
    try {
      console.log("[testDbAccess] Starting database test");
      
      // Check authentication
      console.log("[testDbAccess] Checking authentication...");
      const identity = await ctx.auth.getUserIdentity();
      console.log("[testDbAccess] Auth result:", identity ? "Authenticated" : "Not authenticated");
      
      if (!identity) {
        return {
          success: false,
          error: "Authentication required",
          hasLogo: false,
          timestamp: Date.now(),
          identity: null
        };
      }

      // Try to read one record from logoHistory
      console.log("[testDbAccess] Attempting to query logoHistory table...");
      const logo = await ctx.db
        .query("logoHistory")
        .first();
      console.log("[testDbAccess] Query result:", logo ? "Found logo" : "No logos found");
      
      return {
        success: true,
        hasLogo: logo !== null,
        timestamp: Date.now(),
        identity: {
          subject: identity.subject,
          tokenIdentifier: identity.tokenIdentifier
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[testDbAccess] Error type:", error.constructor.name);
      console.error("[testDbAccess] Error message:", error.message);
      console.error("[testDbAccess] Error stack:", error.stack);
      return {
        success: false,
        error: `Database test failed: ${error.message}`,
        hasLogo: false,
        timestamp: Date.now(),
        identity: null
      };
    }
  }
});
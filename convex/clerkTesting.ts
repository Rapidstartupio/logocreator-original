import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Test query to fetch all logos (limited to 10)
export const getAllLogos = query({
  handler: async (ctx) => {
    try {
      // Check if the logoHistory table exists
      let logos = [];
      try {
        logos = await ctx.db
          .query("logoHistory")
          .take(10);
      } catch (tableError) {
        console.error("[getAllLogos] Table error:", tableError);
        // Return empty array if table doesn't exist or other error
        return {
          success: true,
          logos: [],
          message: "No logos found or table doesn't exist"
        };
      }
      
      return {
        success: true,
        logos: logos.map(logo => ({
          id: logo._id,
          companyName: logo.companyName || "",
          userId: logo.userId || null,
          images: logo.images || [],
          timestamp: logo._creationTime,
          status: logo.status || "unknown"
        }))
      };
    } catch (error) {
      console.error("[getAllLogos] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Test query to check if userAnalytics table exists and has data
export const checkUserAnalyticsTable = query({
  handler: async (ctx) => {
    try {
      // Try to get the first 5 records from userAnalytics table
      let users = [];
      try {
        users = await ctx.db
          .query("userAnalytics")
          .take(5);
      } catch (tableError) {
        console.error("[checkUserAnalyticsTable] Table error:", tableError);
        return {
          success: true,
          tableExists: false,
          recordCount: 0,
          sampleRecords: [],
          message: "Table doesn't exist or cannot be queried"
        };
      }
      
      return {
        success: true,
        tableExists: true,
        recordCount: users.length,
        sampleRecords: users.map(user => ({
          id: user._id,
          userId: user.userId,
          email: user.email || "No email",
          isAdmin: user.isAdmin || false,
          lastActive: user.lastActive || null
        }))
      };
    } catch (error) {
      console.error("[checkUserAnalyticsTable] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Test query that mimics the getRecentLogos function but with simplified logic
// and without requiring user authentication or admin check
export const testGetRecentLogos = query({
  handler: async (ctx) => {
    try {
      // Get recent logos
      let logos = [];
      try {
        logos = await ctx.db
          .query("logoHistory")
          .order("desc")
          .take(10);
      } catch (tableError) {
        console.error("[testGetRecentLogos] Table error:", tableError);
        // Return empty array if table doesn't exist
        return {
          success: true,
          data: []
        };
      }
      
      // Create a map of user IDs to user data
      const userIds = Array.from(new Set(logos.map(logo => logo.userId).filter(Boolean)));
      
      let userMap = new Map();
      try {
        // Get users for these logos
        if (userIds.length > 0) {
          const users = await Promise.all(
            userIds.map(async (userId) => {
              return await ctx.db
                .query("userAnalytics")
                .filter(q => q.eq(q.field("userId"), userId))
                .first();
            })
          );
          
          // Create a map of user IDs to user data
          userMap = new Map(
            users
              .filter((user): user is NonNullable<typeof user> => user !== null)
              .map(user => [user.userId, { email: user.email }])
          );
        }
      } catch (userError) {
        console.error("[testGetRecentLogos] User lookup error:", userError);
        // Continue with empty user map
      }
      
      // Map logos to the format expected by the frontend
      const data = logos.map(logo => ({
        id: logo._id,
        companyName: logo.companyName || "",
        images: logo.images || [],
        timestamp: logo._creationTime,
        status: logo.status || "unknown",
        style: logo.style || "N/A",
        layout: logo.layout || "N/A",
        businessType: logo.businessType || "N/A",
        userId: logo.userId || "",
        userEmail: userMap.get(logo.userId || "")?.email || "Unknown"
      }));
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error("[testGetRecentLogos] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Create a test user in the userAnalytics table
export const createTestUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    isAdmin: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    try {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("userAnalytics")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .first();
      
      if (existingUser) {
        // Update existing user
        await ctx.db.patch(existingUser._id, {
          email: args.email,
          isAdmin: args.isAdmin ?? existingUser.isAdmin ?? false,
          lastActive: Date.now()
        });
        
        return {
          success: true,
          message: "User updated",
          userId: args.userId
        };
      } else {
        // Create new user
        await ctx.db.insert("userAnalytics", {
          userId: args.userId,
          email: args.email,
          isAdmin: args.isAdmin ?? false,
          lastActive: Date.now(),
          totalLogosGenerated: 0,
          credits: 10,
          lastCompanyName: "" // Required field
        });
        
        return {
          success: true,
          message: "User created",
          userId: args.userId
        };
      }
    } catch (error) {
      console.error("[createTestUser] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Test the admin getUserStats function without requiring admin authentication
export const testAdminGetUserStats = query({
  handler: async (ctx) => {
    try {
      // Get all users
      let users = [];
      try {
        users = await ctx.db.query("userAnalytics").collect();
      } catch (tableError) {
        console.error("[testAdminGetUserStats] Table error:", tableError);
        // Return default stats if table doesn't exist
        return {
          success: true,
          stats: {
            totalUsers: 0,
            activeUsersToday: 0,
            newUsersToday: 0,
            totalLogosGenerated: 0
          }
        };
      }
      
      // Calculate today's timestamp
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      // Calculate stats
      const stats = {
        totalUsers: users.length,
        activeUsersToday: users.filter(u => u.lastActive > todayStart).length,
        newUsersToday: users.filter(u => u._creationTime > todayStart).length,
        totalLogosGenerated: users.reduce((sum, u) => sum + (u.totalLogosGenerated || 0), 0)
      };
      
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error("[testAdminGetUserStats] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

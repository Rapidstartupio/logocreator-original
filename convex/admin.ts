import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "./validators";
import { v } from "convex/values";

// Get user statistics for admin dashboard
export const getUserStats = query({
  handler: async (ctx) => {
    try {
      // Get the user identity from the auth context
      const identity = await ctx.auth.getUserIdentity();
      
      // If no identity, the user is not authenticated
      if (!identity) {
        console.log("[getUserStats] No identity found");
        return {
          success: false,
          error: "Authentication required"
        };
      }
      
      // Get the user ID from the identity
      const userId = identity.subject;
      console.log(`[getUserStats] User authenticated: ${userId}`);
      
      // Check if the user exists in the userAnalytics table and is an admin
      const userAnalytics = await ctx.db
        .query("userAnalytics")
        .filter(q => q.eq(q.field("userId"), userId))
        .first();
      
      console.log(`[getUserStats] User analytics found: ${!!userAnalytics}, isAdmin: ${userAnalytics?.isAdmin}`);
      
      // If the user is not an admin, return an error
      if (!userAnalytics?.isAdmin) {
        return {
          success: false,
          error: "Admin access required"
        };
      }
      
      // Try to get all user analytics data
      const allUserAnalytics = await ctx.db.query("userAnalytics").collect();
      
      // Calculate basic stats
      const totalUsers = allUserAnalytics.length;
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const activeUsersToday = allUserAnalytics.filter(user => user.lastActive > oneDayAgo).length;
      
      // Count total logos generated
      const totalLogosGenerated = allUserAnalytics.reduce((sum, user) => sum + (user.totalLogosGenerated || 0), 0);
      
      console.log(`[getUserStats] Stats calculated: ${totalUsers} users, ${activeUsersToday} active today`);
      
      // Return simplified user stats
      return {
        success: true,
        stats: {
          totalUsers,
          activeUsersToday,
          newUsersToday: 0, // Would need user creation date from Clerk
          totalLogosGenerated
        },
        users: allUserAnalytics.map(user => ({
          id: user.userId,
          email: user.email || "unknown",
          totalLogosGenerated: user.totalLogosGenerated || 0,
          lastActive: user.lastActive || 0,
          isAdmin: user.isAdmin || false,
          credits: user.credits || 0
        }))
      };
    } catch (error) {
      console.error("[getUserStats] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Get recent logos for admin dashboard with pagination
export const getRecentLogos = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    try {
      // Get the user identity from the auth context
      const identity = await ctx.auth.getUserIdentity();
      
      // If no identity, the user is not authenticated
      if (!identity) {
        console.log("[getRecentLogos] No identity found");
        return {
          success: false,
          error: "Authentication required",
          data: []
        };
      }
      
      // Get the user ID from the identity
      const userId = identity.subject;
      console.log(`[getRecentLogos] User authenticated: ${userId}`);
      
      // Check if the user exists in the userAnalytics table and is an admin
      const userAnalytics = await ctx.db
        .query("userAnalytics")
        .filter(q => q.eq(q.field("userId"), userId))
        .first();
      
      console.log(`[getRecentLogos] User analytics found: ${!!userAnalytics}, isAdmin: ${userAnalytics?.isAdmin}`);
      
      // If the user is not an admin, return an error
      if (!userAnalytics?.isAdmin) {
        return {
          success: false,
          error: "Admin access required",
          data: []
        };
      }
      
      // Extract pagination options with defaults
      const { paginationOpts } = args;
      const numItems = paginationOpts?.numItems || 10;
      const cursor = paginationOpts?.cursor;
      
      console.log("[getRecentLogos] Query started with:", { numItems, cursor });
      
      // First, check if the logoHistory table exists and has data
      const tableCheck = await ctx.db.query("logoHistory").first();
      if (!tableCheck) {
        console.log("[getRecentLogos] No data in logoHistory table");
        return { 
          success: true, 
          data: [],
          continueCursor: null
        };
      }
      
      // Use the timestamp index for ordering instead of the default _id
      // This provides more reliable pagination
      const queryBuilder = ctx.db.query("logoHistory").withIndex("by_timestamp");
      
      // Get recent logos with pagination
      // Handle cursor properly - it can be undefined, null, or a string
      const logos = await queryBuilder
        .order("desc")
        .paginate({ 
          numItems, 
          cursor: typeof cursor === 'string' ? cursor : null 
        });
      
      // Get total count of logos
      const totalCount = await ctx.db.query("logoHistory").collect().then(all => all.length);
      
      console.log(`[getRecentLogos] Found ${logos.page.length} logos, total: ${totalCount}, has continueCursor: ${!!logos.continueCursor}`);
      
      // Map logos with simplified user data
      const data = logos.page.map(logo => {
        return {
          id: logo._id,
          companyName: logo.companyName || "",
          images: logo.images || [],
          timestamp: logo._creationTime,
          status: logo.status || "unknown",
          style: logo.style || "",
          layout: logo.layout || "",
          businessType: logo.businessType || "",
          prompt: logo.prompt || "",
          additionalInfo: logo.additionalInfo || "",
          generationTime: logo.generationTime || 0,
          modelUsed: logo.modelUsed || "",
          userId: logo.userId || "",
          userEmail: "Unknown" // This will be populated from Clerk on the client side
        };
      });
      
      return { 
        success: true, 
        data,
        continueCursor: logos.continueCursor,
        totalCount 
      };
    } catch (error) {
      console.error("[getRecentLogos] Error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        data: []
      };
    }
  }
});

// List all users for admin dashboard
export const listAllUsers = query({
  handler: async (ctx) => {
    try {
      // Get the user identity from the auth context
      const identity = await ctx.auth.getUserIdentity();
      
      // If no identity, the user is not authenticated
      if (!identity) {
        console.log("[listAllUsers] No identity found");
        return {
          success: false,
          error: "Authentication required"
        };
      }
      
      // Get the user ID from the identity
      const userId = identity.subject;
      console.log(`[listAllUsers] User authenticated: ${userId}`);
      
      // Check if the user exists in the userAnalytics table and is an admin
      const userAnalytics = await ctx.db
        .query("userAnalytics")
        .filter(q => q.eq(q.field("userId"), userId))
        .first();
      
      console.log(`[listAllUsers] User analytics found: ${!!userAnalytics}, isAdmin: ${userAnalytics?.isAdmin}`);
      
      // If the user is not an admin, return an error
      if (!userAnalytics?.isAdmin) {
        return {
          success: false,
          error: "Admin access required"
        };
      }
      
      // Get all user analytics data
      const allUsers = await ctx.db.query("userAnalytics").collect();
      
      return {
        success: true,
        users: allUsers.map(user => ({
          id: user.userId,
          email: user.email || "unknown",
          totalLogosGenerated: user.totalLogosGenerated || 0,
          lastActive: user.lastActive || 0,
          isAdmin: user.isAdmin || false,
          credits: user.credits || 0
        }))
      };
    } catch (error) {
      console.error("[listAllUsers] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Find a user by userId
export const findUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("[findUser] Looking for user with ID:", args.userId);
      
      // Check if the user exists in the userAnalytics table
      const user = await ctx.db
        .query("userAnalytics")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .first();
      
      if (!user) {
        console.log("[findUser] User not found");
        return {
          success: false,
          message: "User not found",
          user: null
        };
      }
      
      console.log("[findUser] User found:", user._id);
      return {
        success: true,
        message: "User found",
        user
      };
    } catch (error) {
      console.error("[findUser] Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        user: null
      };
    }
  }
});

// Simple test query
export const testQuery = query({
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      
      return {
        success: true,
        message: "Test query successful",
        timestamp: Date.now(),
        identity: identity ? {
          subject: identity.subject,
          tokenIdentifier: identity.tokenIdentifier
        } : null
      };
    } catch (error) {
      console.error("[testQuery] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Initialize a user in the userAnalytics table
export const initializeUser = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    isAdmin: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    try {
      console.log("[initializeUser] Starting with args:", args);
      const { userId, email, isAdmin } = args;
      
      // Check if the user already exists
      const existingUser = await ctx.db
        .query("userAnalytics")
        .filter(q => q.eq(q.field("userId"), userId))
        .first();
      
      console.log("[initializeUser] Existing user check:", !!existingUser);
      
      if (existingUser) {
        // Update the existing user if needed
        console.log("[initializeUser] Updating existing user:", existingUser._id);
        await ctx.db.patch(existingUser._id, {
          email: email || existingUser.email,
          isAdmin: isAdmin !== undefined ? isAdmin : existingUser.isAdmin,
          lastActive: Date.now()
        });
        
        return {
          success: true,
          message: "User updated",
          user: {
            id: existingUser.userId,
            email: email || existingUser.email,
            isAdmin: isAdmin !== undefined ? isAdmin : existingUser.isAdmin
          }
        };
      }
      
      // Create a new user - ensure all required fields are present
      console.log("[initializeUser] Creating new user");
      const newUserId = await ctx.db.insert("userAnalytics", {
        userId,
        email: email || "unknown@example.com",
        isAdmin: isAdmin || false,
        totalLogosGenerated: 0,
        lastActive: Date.now(),
        lastCompanyName: "", // Required field in the schema
        credits: 0
      });
      
      console.log("[initializeUser] New user created with ID:", newUserId);
      
      return {
        success: true,
        message: "User created",
        user: {
          id: userId,
          email: email || "unknown@example.com",
          isAdmin: isAdmin || false
        }
      };
    } catch (error) {
      console.error("[initializeUser] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
import { query } from "./_generated/server";
import { v } from "convex/values";

// Get user statistics for admin dashboard
export const getUserStats = query({
  handler: async (ctx) => {
    try {
      // Count total logos generated
      const totalLogos = await ctx.db
        .query("logoHistory")
        .collect();
      
      return {
        success: true,
        stats: {
          totalUsers: 0, // This would come from Clerk
          activeUsersToday: 0, // This would come from Clerk
          newUsersToday: 0, // This would come from Clerk
          totalLogosGenerated: totalLogos.length // Count from Convex
        },
        users: [] // This would come from Clerk
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

// Define a type for the logo document to avoid using 'any'
type LogoDocument = {
  _id: string;
  _creationTime: number;
  companyName?: string;
  images?: string[];
  status?: string;
  style?: string;
  layout?: string;
  businessType?: string;
  prompt?: string;
  additionalInfo?: string;
  generationTime?: number;
  modelUsed?: string;
  userId?: string;
};

// Get recent logos for admin dashboard with pagination and search
export const getRecentLogos = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit ?? 20;
      let logoQuery = ctx.db.query("logoHistory");
      
      // Apply search filter if provided
      if (args.searchTerm && args.searchTerm.trim() !== "") {
        const searchTerm = args.searchTerm.toLowerCase().trim();
        // Note: Using a prefix search instead of contains since Convex doesn't support contains directly
        logoQuery = logoQuery.filter(q => 
          // Using a simple equality check for now - in production you might want to use a more sophisticated search
          q.eq(q.field("companyName"), searchTerm)
        );
      }
      
      // Filter by userId if provided
      if (args.userId && args.userId.trim() !== "") {
        logoQuery = logoQuery.filter(q => 
          q.eq(q.field("userId"), args.userId)
        );
      }
      
      // Order by creation time (newest first)
      const orderedQuery = logoQuery.order("desc");
      
      // Apply pagination
      let logos;
      if (args.cursor) {
        logos = await orderedQuery.paginate({ numItems: limit, cursor: args.cursor });
      } else {
        // For the first page, we don't need to provide a cursor
        // But we need to provide a null cursor to satisfy the TypeScript type
        logos = await orderedQuery.paginate({ numItems: limit, cursor: null });
      }
      
      // Map logos with simplified user data
      const data = logos.page.map((logo: LogoDocument) => {
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
          userEmail: "Unknown" // This will be populated on the client
        };
      });
      
      return { 
        success: true, 
        data,
        continueCursor: logos.continueCursor
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

// Get total logo count
export const getTotalLogoCount = query({
  handler: async (ctx) => {
    try {
      const logos = await ctx.db
        .query("logoHistory")
        .collect();
      
      return { 
        success: true, 
        count: logos.length 
      };
    } catch (error) {
      console.error("[getTotalLogoCount] Error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        count: 0
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
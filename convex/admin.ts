import { query } from "./_generated/server";

// Get user statistics for admin dashboard
export const getUserStats = query({
  handler: async () => {
    try {
      // For now, we'll just return a simplified response
      // since user data is primarily in Clerk, not Convex
      return {
        success: true,
        stats: {
          totalUsers: 0, // This would come from Clerk
          activeUsersToday: 0, // This would come from Clerk
          newUsersToday: 0, // This would come from Clerk
          totalLogosGenerated: 0 // This can be calculated from Convex
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

// Get recent logos for admin dashboard
export const getRecentLogos = query({
  handler: async (ctx) => {
    try {
      // Get recent logos
      const logos = await ctx.db
        .query("logoHistory")
        .order("desc")
        .take(50);
      
      // Map logos with simplified user data
      // Since we don't have access to Clerk user data directly in Convex,
      // we'll just include the userId and leave email as "Unknown"
      const data = logos.map(logo => {
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
          userEmail: "Unknown" // This would come from Clerk
        };
      });
      
      return { success: true, data };
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
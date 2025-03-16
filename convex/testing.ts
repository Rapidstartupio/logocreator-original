import { query } from "./_generated/server";
import { v } from "convex/values";

// Test function to check if logoHistory table exists and has data
export const testLogoHistoryTable = query({
  handler: async (ctx) => {
    try {
      // Test 1: Count total records in logoHistory
      const totalLogos = await ctx.db.query("logoHistory").collect();
      
      // Test 2: Get the first 3 records without pagination
      const sampleLogos = await ctx.db.query("logoHistory").take(3);
      
      // Test 3: Test pagination with explicit null cursor
      const paginationTestNull = await ctx.db
        .query("logoHistory")
        .order("desc")
        .paginate({ numItems: 2, cursor: null });
      
      // Test 4: Check indexes
      const byUserIndex = await ctx.db
        .query("logoHistory")
        .withIndex("by_user")
        .collect();
      
      return {
        success: true,
        diagnostics: {
          totalLogos: totalLogos.length,
          hasSampleData: sampleLogos.length > 0,
          sampleData: sampleLogos.map(logo => ({
            id: logo._id,
            companyName: logo.companyName,
            userId: logo.userId,
            timestamp: logo._creationTime
          })),
          paginationTest: {
            pageSize: paginationTestNull.page.length,
            hasContinueCursor: !!paginationTestNull.continueCursor
          },
          indexTest: {
            byUserCount: byUserIndex.length
          }
        }
      };
    } catch (error) {
      console.error("[testLogoHistoryTable] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Test the getRecentLogos query with different cursor values
export const testGetRecentLogos = query({
  args: {
    testCase: v.string(),
    numItems: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    try {
      const { testCase, numItems = 5 } = args;
      let result;
      
      switch (testCase) {
        case "null_cursor":
          // Test with explicit null cursor
          result = await ctx.db
            .query("logoHistory")
            .order("desc")
            .paginate({ numItems, cursor: null });
          break;
          
        case "undefined_cursor":
          // Test with undefined cursor (should be treated as null)
          result = await ctx.db
            .query("logoHistory")
            .order("desc")
            .paginate({ numItems, cursor: null });
          break;
          
        case "empty_string_cursor":
          // Test with empty string cursor (might cause issues)
          result = await ctx.db
            .query("logoHistory")
            .order("desc")
            .paginate({ numItems, cursor: null });
          break;
          
        case "first_page":
          // Get first page normally
          result = await ctx.db
            .query("logoHistory")
            .order("desc")
            .paginate({ numItems, cursor: null });
          break;
          
        default:
          throw new Error(`Unknown test case: ${testCase}`);
      }
      
      return {
        success: true,
        testCase,
        result: {
          pageSize: result.page.length,
          hasContinueCursor: !!result.continueCursor,
          continueCursor: result.continueCursor,
          firstItem: result.page[0] ? {
            id: result.page[0]._id,
            companyName: result.page[0].companyName,
            timestamp: result.page[0]._creationTime
          } : null
        }
      };
    } catch (error) {
      console.error(`[testGetRecentLogos:${args.testCase}] Error:`, error);
      return {
        success: false,
        testCase: args.testCase,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

// Test function to check user data mapping
export const testUserDataMapping = query({
  handler: async (ctx) => {
    try {
      // Get all unique userIds from logoHistory
      const logos = await ctx.db.query("logoHistory").collect();
      const userIds = new Set<string>();
      
      logos.forEach(logo => {
        if (logo.userId) {
          userIds.add(logo.userId);
        }
      });
      
      // Check if these userIds exist in userAnalytics
      const userAnalytics = await ctx.db.query("userAnalytics").collect();
      const analyticsUserIds = new Set<string>();
      
      userAnalytics.forEach(user => {
        analyticsUserIds.add(user.userId);
      });
      
      // Find missing users
      const missingUsers = Array.from(userIds).filter(id => !analyticsUserIds.has(id));
      
      return {
        success: true,
        diagnostics: {
          totalLogos: logos.length,
          uniqueUserIds: userIds.size,
          userIdsWithAnalytics: analyticsUserIds.size,
          missingUserAnalytics: missingUsers.length,
          missingUserIds: missingUsers
        }
      };
    } catch (error) {
      console.error("[testUserDataMapping] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

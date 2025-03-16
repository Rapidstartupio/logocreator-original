import { GenericQueryCtx } from "convex/server";
import { DataModel } from "./_generated/dataModel";

// Helper function to check if a user is an admin
export async function checkAdminAccess(ctx: GenericQueryCtx<DataModel>) {
  try {
    // Get the user identity from the auth context
    const identity = await ctx.auth.getUserIdentity();
    
    // If no identity, the user is not authenticated
    if (!identity) {
      throw new Error("Authentication required");
    }
    
    // Get the user ID from the identity
    const userId = identity.subject;
    
    // Check if the user exists in the userAnalytics table
    const userAnalytics = await ctx.db
      .query("userAnalytics")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    // If the user has isAdmin flag set to true, they are an admin
    if (userAnalytics?.isAdmin === true) {
      return true;
    }
    
    // Otherwise, throw an error
    throw new Error("Admin access required");
  } catch (error) {
    // Re-throw the error with a more descriptive message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Admin access check failed: ${String(error)}`);
  }
}

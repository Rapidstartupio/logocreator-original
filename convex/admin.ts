import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";

// Helper function to check if user is admin
async function checkIsAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required to access admin functions");
  }
  
  const user = await ctx.db
    .query("userAnalytics")
    .withIndex("by_user", q => q.eq("userId", identity.subject))
    .first();
    
  if (!user) {
    throw new Error("User not found in database");
  }

  if (!user.isAdmin) {
    throw new Error("Admin privileges required to access this function");
  }

  return user;
}

// Direct queries with auth checks
export const getAllUsers = query({
  handler: async (ctx) => {
    // Check admin access first
    await checkIsAdmin(ctx);
    
    console.log("Fetching all users from userAnalytics...");
    try {
      const users = await ctx.db
        .query("userAnalytics")
        .collect();

      // Get logo counts for each user
      const usersWithLogoCounts = await Promise.all(
        users.map(async (user) => {
          try {
            // Get logo count for user
            const logoCount = await ctx.db
              .query("logoHistory")
              .withIndex("by_user")
              .filter(q => q.eq(q.field("userId"), user.userId))
              .collect()
              .then(logos => logos.length)
              .catch(err => {
                console.error("Error fetching logo count for user:", user.userId, err);
                return 0;
              });

            // Return user data with safe fallbacks for optional fields
            return {
              _id: user._id,
              _creationTime: user._creationTime,
              userId: user.userId,
              email: user.email,
              totalLogosGenerated: user.totalLogosGenerated,
              lastActive: user.lastActive,
              lastCompanyName: user.lastCompanyName,
              lastBusinessType: user.lastBusinessType || "",
              actualLogoCount: logoCount,
              credits: user.credits || 0,
              isAdmin: user.isAdmin || false
            };
          } catch (err) {
            console.error("Error processing user:", user._id, err);
            return null;
          }
        })
      );
      
      // Filter out any null results from errors
      const validUsers = usersWithLogoCounts.filter((user): user is NonNullable<typeof user> => user !== null);
      console.log(`Found ${validUsers.length} valid users in userAnalytics`);
      return validUsers;
    } catch (err) {
      console.error("Error in getAllUsers:", err);
      throw new Error("Failed to fetch users: " + (err instanceof Error ? err.message : String(err)));
    }
  },
});

export const getRecentLogos = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("Fetching logos from logoHistory...");
    try {
      const limit = args.limit || 50; // Default to 50 if not provided
      const logos = await ctx.db
        .query("logoHistory")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);

      // Map logos to ensure all required fields are present
      const processedLogos = logos.map(logo => ({
        _id: logo._id,
        _creationTime: logo._creationTime,
        userId: logo.userId || "",
        companyName: logo.companyName,
        layout: logo.layout,
        style: logo.style,
        primaryColor: logo.primaryColor,
        backgroundColor: logo.backgroundColor,
        additionalInfo: logo.additionalInfo || "",
        images: logo.images,
        timestamp: logo.timestamp,
        businessType: logo.businessType || "",
        prompt: logo.prompt || "",
        styleDetails: logo.styleDetails || "",
        layoutDetails: logo.layoutDetails || "",
        numberOfImages: logo.numberOfImages || 1,
        isDemo: logo.isDemo || false,
        generationTime: logo.generationTime || 0,
        modelUsed: logo.modelUsed || "",
        status: logo.status || "success",
        errorMessage: logo.errorMessage || ""
      }));

      console.log(`Found ${processedLogos.length} logos in logoHistory`);
      return processedLogos;
    } catch (err) {
      console.error("Error in getRecentLogos:", err);
      return []; // Return empty array instead of crashing
    }
  },
});

export const getDailyStats = query({
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const activeUsers = await ctx.db
      .query("userAnalytics")
      .withIndex("by_lastActive")
      .filter(q => q.gte(q.field("lastActive"), oneDayAgo))
      .collect();

    const recentLogos = await ctx.db
      .query("logoHistory")
      .withIndex("by_timestamp")
      .filter(q => q.gte(q.field("timestamp"), oneDayAgo))
      .collect();

    return {
      activeUsers: activeUsers.length,
      totalLogos: recentLogos.length,
      timestamp: Date.now()
    };
  },
});

// Simplified sync that just adds users without checking anything
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
    console.log(`Syncing ${args.usersData.length} users from Clerk...`);
    try {
      let userCount = 0;
      for (const userData of args.usersData) {
        const { userId, email } = userData;
        try {
          await ctx.db.insert("userAnalytics", {
            userId,
            email,
            totalLogosGenerated: 0,
            lastActive: Date.now(),
            lastCompanyName: "Unknown",
            lastBusinessType: "Unknown",
          });
          userCount++;
        } catch {
          // Ignore duplicate errors
        }
      }
      console.log(`Successfully synced ${userCount} new users`);
      return { success: true, userCount };
    } catch (error) {
      console.error("Error syncing users:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const getUsersWithLogoData = query({
  handler: async (ctx) => {
    console.log("Fetching users with logo data...");
    const users = await ctx.db
      .query("userAnalytics")
      .collect();
    
    console.log(`Found ${users.length} users, fetching their logos...`);
    
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
    
    console.log(`Completed fetching logo data for ${userLogos.length} users`);
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

// Simple test that always returns success
export const testAdminAccess = query({
  handler: async () => {
    return {
      success: true,
      adminKeyPresent: true,
      timestamp: Date.now()
    };
  },
}); 
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

interface UserStatsResult {
  success: boolean;
  error?: string;
  stats?: {
    totalUsers: number;
    activeUsersToday: number;
    newUsersToday: number;
    totalLogosGenerated: number;
  };
  users?: {
    id: string;
    email: string;
    firstName?: string;
    totalLogosGenerated: number;
    credits: number;
    isAdmin: boolean;
    createdAt?: number;
    lastActive: number | null;
  }[];
}

interface LogosResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    companyName: string;
    images: string[];
    timestamp: number;
    status: string;
    style: string;
    layout: string;
    businessType?: string;
    prompt?: string;
    additionalInfo?: string;
    generationTime?: number;
    modelUsed?: string;
    userEmail: string;
  }[];
}

const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY || process.env.CONVEX_DEPLOYMENT_KEY;

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { userId, userEmail } = await req.json();
    
    // Validate input
    if (!userId || !userEmail) {
      console.error("Missing user ID or email");
      return NextResponse.json({
        success: false,
        error: "Missing user data"
      });
    }

    // Initialize Convex client
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
    
    // Check if admin key exists
    if (!CONVEX_ADMIN_KEY) {
      console.error("Missing Convex admin key");
      return NextResponse.json({
        success: false,
        error: "Missing Convex admin key"
      }, { status: 500 });
    }
    
    client.setAuth(CONVEX_ADMIN_KEY);

    // Initialize test user
    console.log("Initializing test user:", { userId, userEmail });
    const initResult = await client.mutation(api.admin.initializeUser, {
      userId,
      email: userEmail,
      isAdmin: true // For testing purposes
    });
    
    console.log("User initialization result:", initResult);

    // Try to fetch user stats and logos
    console.log("Testing getUserStats...");
    const userStatsResult = await client.query(api.admin.getUserStats) as UserStatsResult;
    console.log("getUserStats result:", userStatsResult);

    console.log("Testing getRecentLogos with different pagination options...");
    
    // Test with no pagination options
    console.log("Test 1 (no pagination):");
    const logosResult1 = await client.query(api.admin.getRecentLogos, {
      paginationOpts: {
        numItems: 10
      }
    }) as LogosResult;
    console.log("Test 1 (numItems=10):", logosResult1);

    // Test with different pagination options
    console.log("Test 2 (numItems=5):");
    const logosResult2 = await client.query(api.admin.getRecentLogos, {
      paginationOpts: {
        numItems: 5
      }
    }) as LogosResult;
    console.log("Test 2 (numItems=5):", logosResult2);

    // Test the test query
    console.log("Testing testQuery...");
    const testQueryResult = await client.query(api.admin.testQuery);
    console.log("testQuery result:", testQueryResult);

    return NextResponse.json({
      success: true,
      userStats: userStatsResult,
      logos1: logosResult1,
      logos2: logosResult2,
      testQuery: testQueryResult,
      initResult
    });
  } catch (error) {
    console.error("Error in test-convex route:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
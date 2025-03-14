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
  users?: Array<{
    id: string;
    email: string;
    firstName: string;
    totalLogosGenerated: number;
    credits: number;
    isAdmin: boolean;
    createdAt: number;
    lastActive: number | null;
  }>;
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
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return NextResponse.json({
      success: false,
      error: "Missing NEXT_PUBLIC_CONVEX_URL environment variable"
    }, { status: 500 });
  }

  if (!CONVEX_ADMIN_KEY) {
    return NextResponse.json({
      success: false,
      error: "Missing Convex admin key"
    }, { status: 500 });
  }

  try {
    // Get user data from request
    const body = await req.json();
    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json({
        success: false,
        error: "Missing user data"
      });
    }

    // Initialize Convex client
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    client.setAuth(CONVEX_ADMIN_KEY);

    // Initialize test user
    await client.mutation(api.admin.initializeUser, {
      userId,
      email: userEmail,
      isAdmin: true // For testing purposes
    });

    // Try to fetch user stats and logos
    const userStatsResult = await client.query(api.admin.getUserStats) as UserStatsResult;
    const logosResult = await client.query(api.admin.getRecentLogos) as LogosResult;

    return NextResponse.json({
      success: true,
      userStats: {
        success: userStatsResult?.success || false,
        error: userStatsResult?.error,
        stats: userStatsResult?.stats,
        users: userStatsResult?.users?.length || 0
      },
      logos: {
        success: logosResult?.success || false,
        error: logosResult?.error,
        count: logosResult?.data?.length || 0
      }
    });
  } catch (error) {
    console.error("Convex test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
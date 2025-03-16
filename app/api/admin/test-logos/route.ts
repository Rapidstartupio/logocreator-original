import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Create a Convex client for direct API calls
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not defined");
    throw new Error("Convex URL not configured");
  }
  return new ConvexHttpClient(convexUrl);
};

// Handle POST requests to fetch logos
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { paginationOpts } = body;

    // Create a Convex client
    const convex = createConvexClient();

    // Log the request details for debugging
    console.log("[test-logos] Request:", {
      paginationOpts,
      userId
    });

    // Format pagination options
    const formattedPaginationOpts = {
      numItems: paginationOpts?.numItems || 10,
      cursor: paginationOpts?.cursor || undefined,
    };

    // Fetch logos from Convex
    const result = await convex.query(api.admin.getRecentLogos, {
      paginationOpts: formattedPaginationOpts,
    });

    // Return the result
    return NextResponse.json({
      success: true,
      data: result.data || [],
      continueCursor: result.continueCursor,
      requestParams: { paginationOpts: formattedPaginationOpts }
    });
  } catch (error) {
    console.error("[test-logos] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Keep the GET method for testing purposes
export async function GET() {
  try {
    // Test 1: Basic query without pagination
    console.log('Test 1: Attempting basic query without pagination');
    try {
      const convex = createConvexClient();
      const basicResult = await convex.query(api.admin.getUserStats);
      console.log('Basic query succeeded:', basicResult);
    } catch (error) {
      console.error('Basic query failed:', error);
    }

    // Test 2: Query with null cursor
    console.log('\nTest 2: Attempting logos query with null cursor');
    try {
      const convex = createConvexClient();
      const nullCursorResult = await convex.query(api.admin.getRecentLogos, {
        paginationOpts: {
          numItems: 5,
          cursor: undefined
        }
      });
      console.log('Null cursor query succeeded:', nullCursorResult);
    } catch (error) {
      console.error('Null cursor query failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Logo query tests completed, check server logs for details'
    });
  } catch (error) {
    console.error('Error in test-logos route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

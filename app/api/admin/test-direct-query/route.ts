import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getAuth } from "@clerk/nextjs/server";

// Create a Convex client for direct API calls
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not defined");
    throw new Error("Convex URL not configured");
  }
  return new ConvexHttpClient(convexUrl);
};

// Handle POST requests to test direct Convex queries
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
    const { queryType, paginationOpts } = body;

    // Create a Convex client
    const convex = createConvexClient();

    // Log the request details for debugging
    console.log("[test-direct-query] Request:", {
      queryType,
      paginationOpts,
      userId
    });

    // Execute the appropriate query based on the queryType
    let result;
    switch (queryType) {
      case "getUserStats":
        result = await convex.query(api.admin.getUserStats);
        break;
      case "getRecentLogos":
        // Ensure paginationOpts is properly formatted
        const formattedPaginationOpts = {
          numItems: paginationOpts?.numItems || 10,
          cursor: paginationOpts?.cursor || null,
        };
        result = await convex.query(api.admin.getRecentLogos, {
          paginationOpts: formattedPaginationOpts,
        });
        break;
      case "testQuery":
        result = await convex.query(api.admin.testQuery);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown query type: ${queryType}` },
          { status: 400 }
        );
    }

    // Return the result
    return NextResponse.json({
      success: true,
      data: result,
      requestParams: { queryType, paginationOpts }
    });
  } catch (error) {
    console.error("[test-direct-query] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

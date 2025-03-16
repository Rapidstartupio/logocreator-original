import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the auth information from Clerk
    const { userId, sessionId, getToken } = auth();
    
    // Get the JWT token that would be sent to Convex
    const token = await getToken({ template: "convex" });
    
    // Return the auth information
    return NextResponse.json({
      success: true,
      auth: {
        userId,
        sessionId,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      },
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

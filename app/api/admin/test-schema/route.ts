import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

// Create a Convex client for direct API testing
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

export async function GET() {
  try {
    // Test basic connectivity to Convex
    const testResult = await convex.query(api.admin.testQuery);
    
    // Get user stats as a basic test
    const statsResult = await convex.query(api.admin.getUserStats);

    return NextResponse.json({
      success: true,
      testResult,
      statsResult
    });
  } catch (error) {
    console.error('Error in test-schema route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

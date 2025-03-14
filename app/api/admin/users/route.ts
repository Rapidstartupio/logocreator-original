import { NextResponse, NextRequest } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getAuth } from '@clerk/nextjs/server';

// Create a Convex HTTP client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

export async function GET(request: NextRequest) {
  try {
    // Get auth information from Clerk
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('API route: Fetching users directly from database');
    
    // Directly query the database using the Convex HTTP client
    // This bypasses the React hooks that are causing issues
    const users = await convex.query(api.admin.listAllUsers);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in admin users API route:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

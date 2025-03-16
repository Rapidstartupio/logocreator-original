import { NextResponse, NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth information from Clerk
    const { userId } = getAuth(request);
    
    console.log('Debug API: Auth check - User ID:', userId);
    
    if (!userId) {
      console.log('Debug API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Debug API: Fetching users from Clerk');
    console.log('Debug API: Clerk Secret Key available:', !!process.env.CLERK_SECRET_KEY);
    
    // Test environment variables
    const envVars = {
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      NEXT_PUBLIC_CLERK_DOMAIN: process.env.NEXT_PUBLIC_CLERK_DOMAIN,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      NODE_ENV: process.env.NODE_ENV
    };
    
    // Fetch users from Clerk with detailed error handling
    try {
      // First, try to get the current user to verify authentication
      const currentUser = await clerkClient.users.getUser(userId);
      console.log('Debug API: Current user fetched successfully');
      
      // Then try to get the list of users
      const usersResponse = await clerkClient.users.getUserList({
        limit: 10,
      });
      
      const users = usersResponse.data;
      console.log(`Debug API: Successfully fetched ${users.length} users from Clerk`);
      
      if (users.length > 0) {
        // Log first user for debugging (without sensitive info)
        console.log('Debug API: First user example:', {
          id: users[0].id,
          emailCount: users[0].emailAddresses.length,
          hasFirstName: !!users[0].firstName,
          createdAt: users[0].createdAt
        });
      } else {
        console.log('Debug API: No users found in Clerk');
      }
      
      return NextResponse.json({ 
        success: true, 
        currentUser: {
          id: currentUser.id,
          email: currentUser.emailAddresses[0]?.emailAddress,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName
        },
        userCount: users.length,
        users: users.map(user => ({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        })),
        envVars
      });
    } catch (clerkError) {
      console.error('Debug API: Error fetching from Clerk:', clerkError);
      return NextResponse.json({ 
        error: 'Failed to fetch users from Clerk', 
        details: clerkError instanceof Error ? clerkError.message : String(clerkError),
        envVars
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Debug API: General error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

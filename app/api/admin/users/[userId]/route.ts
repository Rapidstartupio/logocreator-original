import { NextResponse, NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get auth information from Clerk
    const { userId: adminId } = getAuth(request);
    
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user from Clerk
    try {
      const user = await clerkClient.users.getUser(params.userId);
      
      return NextResponse.json({ 
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddresses: user.emailAddresses,
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt
        }
      });
    } catch (clerkError) {
      console.error('Error fetching user from Clerk:', clerkError);
      return NextResponse.json({ 
        error: 'Failed to fetch user from Clerk'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('General error in admin user API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user'
    }, { status: 500 });
  }
} 
import { NextResponse, NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

// Create a Convex HTTP client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

export async function GET(request: NextRequest) {
  try {
    // Get auth information from Clerk
    const { userId } = getAuth(request);
    
    console.log('API route: Auth check - User ID:', userId);
    
    if (!userId) {
      console.log('API route: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageNumber = parseInt(searchParams.get('page') || '1');
    const offset = (pageNumber - 1) * pageSize;
    const searchQuery = searchParams.get('search') || '';
    
    console.log('API route: Fetching users from Clerk');
    console.log(`API route: Pagination - Page ${pageNumber}, Size ${pageSize}, Offset ${offset}`);
    if (searchQuery) {
      console.log(`API route: Search query - "${searchQuery}"`);
    }
    console.log('API route: Clerk Secret Key available:', !!process.env.CLERK_SECRET_KEY);
    
    // Fetch users from Clerk with detailed error handling
    try {
      // Get total count first
      const totalCountResponse = await clerkClient.users.getCount();
      const totalUsers = totalCountResponse;
      
      // Then get all users for searching or the paginated users if no search
      let usersResponse;
      if (searchQuery) {
        // For search, we need to get all users and filter them manually
        // since Clerk API doesn't support searching directly
        usersResponse = await clerkClient.users.getUserList({
          limit: 250, // Get more users for search, but still limit to avoid performance issues
        });
      } else {
        // Normal pagination without search
        usersResponse = await clerkClient.users.getUserList({
          limit: pageSize,
          offset: offset,
        });
      }
      
      let users = usersResponse.data;
      let filteredCount = totalUsers;
      
      // If there's a search query, filter the users
      if (searchQuery && searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        users = users.filter(user => {
          // Search in email addresses
          const emailMatch = user.emailAddresses.some(email => 
            email.emailAddress.toLowerCase().includes(lowerQuery)
          );
          
          // Search in names
          const firstNameMatch = user.firstName?.toLowerCase().includes(lowerQuery) || false;
          const lastNameMatch = user.lastName?.toLowerCase().includes(lowerQuery) || false;
          
          // Search in user ID
          const idMatch = user.id.toLowerCase().includes(lowerQuery);
          
          return emailMatch || firstNameMatch || lastNameMatch || idMatch;
        });
        
        filteredCount = users.length;
        
        // Apply pagination to filtered results
        users = users.slice(offset, offset + pageSize);
        
        console.log(`API route: Search found ${filteredCount} matching users out of ${totalUsers} total`);
      }
      
      console.log(`API route: Successfully fetched ${users.length} users from Clerk (total: ${filteredCount})`);
      
      if (users.length > 0) {
        // Log first user for debugging (without sensitive info)
        console.log('API route: First user example:', {
          id: users[0].id,
          emailCount: users[0].emailAddresses.length,
          hasFirstName: !!users[0].firstName,
          createdAt: users[0].createdAt
        });
      } else {
        console.log('API route: No users found in Clerk for this page/search');
      }
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(filteredCount / pageSize);
      const hasNextPage = pageNumber < totalPages;
      const hasPreviousPage = pageNumber > 1;
      
      // Fetch Convex user data
      const convexUsers = await convex.query(api.admin.listAllUsers);
      console.log('Convex users:', convexUsers);
      
      return NextResponse.json({ 
        users,
        pagination: {
          totalUsers: filteredCount,
          totalPages,
          currentPage: pageNumber,
          pageSize,
          hasNextPage,
          hasPreviousPage,
          searchQuery: searchQuery || null
        }
      });
    } catch (clerkError) {
      console.error('API route: Error fetching from Clerk:', clerkError);
      return NextResponse.json({ 
        error: 'Failed to fetch users from Clerk', 
        details: clerkError instanceof Error ? clerkError.message : String(clerkError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API route: General error in admin users API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

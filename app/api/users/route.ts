import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { User } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('query') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Fetch users from Clerk with pagination
    // Note: Clerk API uses limit/offset pagination
    const usersResponse = await clerkClient.users.getUserList({
      limit,
      offset,
      // Unfortunately, Clerk doesn't support direct text search in the SDK
      // We'll filter the results on our side
    });
    
    // Filter users by search query if provided
    let filteredUsers = usersResponse.data;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filteredUsers = filteredUsers.filter(user => {
        const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() || '';
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';
        return (
          email.includes(lowerQuery) || 
          firstName.includes(lowerQuery) || 
          lastName.includes(lowerQuery)
        );
      });
    }
    
    // Transform user data for the frontend
    const transformedUsers = filteredUsers.map((user: User) => ({
      id: user.id,
      emailAddress: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }));
    
    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        total: usersResponse.totalCount,
        limit,
        offset,
        hasMore: offset + limit < usersResponse.totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

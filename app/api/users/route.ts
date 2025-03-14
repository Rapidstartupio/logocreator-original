import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { User } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch users from Clerk
    const usersResponse = await clerkClient.users.getUserList();
    
    // Transform user data for the frontend
    const transformedUsers = usersResponse.data.map((user: User) => ({
      id: user.id,
      emailAddress: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }));
    
    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

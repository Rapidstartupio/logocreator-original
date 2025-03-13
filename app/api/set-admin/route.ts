import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST() {
  try {
    // Get the current user
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized - No user found", { status: 401 });
    }

    // Check if the user's email is admin@admin.com
    const isAdminEmail = user.emailAddresses.some(
      email => email.emailAddress === "admin@admin.com"
    );

    if (!isAdminEmail) {
      return new NextResponse("Unauthorized - Not an admin email", { status: 401 });
    }

    // Set the admin role in public metadata
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        roles: ["admin"]
      }
    });

    return new NextResponse("Admin role set successfully", { status: 200 });
  } catch (error) {
    console.error("Error setting admin role:", error);
    return new NextResponse(
      `Internal Error: ${error instanceof Error ? error.message : "Unknown error"}`, 
      { status: 500 }
    );
  }
} 
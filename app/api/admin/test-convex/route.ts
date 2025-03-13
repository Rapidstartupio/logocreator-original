import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST() {
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Try to fetch some basic data
    const users = await client.query(api.admin.getAllUsers);
    const logos = await client.query(api.admin.getRecentLogos, { limit: 10 });
    
    return Response.json({
      success: true,
      userCount: users.length,
      logoCount: logos.length,
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL
    });
  } catch (error) {
    console.error("Convex test error:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
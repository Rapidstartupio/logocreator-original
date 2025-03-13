import { ConvexClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY || process.env.CONVEX_DEPLOYMENT_KEY;

export async function POST() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return Response.json({
      success: false,
      error: "Missing NEXT_PUBLIC_CONVEX_URL environment variable"
    }, { status: 500 });
  }

  if (!CONVEX_ADMIN_KEY) {
    return Response.json({
      success: false,
      error: "Missing Convex admin key"
    }, { status: 500 });
  }

  try {
    const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    client.setAuth(() => Promise.resolve(CONVEX_ADMIN_KEY));
    
    // Try to fetch some basic data
    const users = await client.query(api.admin.getAllUsers, {});
    const logos = await client.query(api.admin.getRecentLogos, { limit: 10 });
    
    return Response.json({
      success: true,
      userCount: users?.length || 0,
      logoCount: logos?.length || 0,
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL
    });
  } catch (error) {
    console.error("Convex test error:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 
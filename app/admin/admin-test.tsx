import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AdminTest() {
  const { user } = useUser();
  const [clerkTest, setClerkTest] = useState<string>("");
  const [convexTest, setConvexTest] = useState<string>("");
  
  // Direct Convex query tests
  const testUsers = useQuery(api.admin.getAllUsers);
  const testLogos = useQuery(api.admin.getRecentLogos, { limit: 10 });
  
  // Test Clerk connection
  const testClerk = async () => {
    try {
      setClerkTest("Testing Clerk connection...");
      if (user) {
        setClerkTest(`Clerk connection successful! User ID: ${user.id}`);
      } else {
        setClerkTest("No user found in Clerk session");
      }
    } catch (error) {
      setClerkTest(`Clerk error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test Convex connection
  const testConvex = async () => {
    try {
      setConvexTest("Testing Convex connections...");
      
      // Test direct Convex queries
      const usersResult = testUsers ? 
        `Users query successful (${testUsers.length} users)` : 
        "Users query failed";
      
      const logosResult = testLogos ? 
        `Logos query successful (${testLogos.length} logos)` : 
        "Logos query failed";
      
      // Test through API
      const result = await fetch("/api/admin/test-convex", {
        method: "POST",
      });
      const data = await result.json();
      
      setConvexTest(`
        Direct queries:
        - ${usersResult}
        - ${logosResult}
        API test: ${JSON.stringify(data, null, 2)}
      `);
    } catch (error) {
      setConvexTest(`Convex error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-800 rounded-lg bg-gray-900">
      <h2 className="text-xl font-bold text-white">Connection Tests</h2>
      
      <div className="space-y-2">
        <Button onClick={testClerk} variant="outline">Test Clerk Connection</Button>
        <div className="text-sm whitespace-pre-wrap bg-gray-800 p-3 rounded-md text-gray-200">{clerkTest || "No test run yet"}</div>
      </div>

      <div className="space-y-2">
        <Button onClick={testConvex} variant="outline">Test Convex Connection</Button>
        <div className="text-sm whitespace-pre-wrap font-mono bg-gray-800 p-3 rounded-md text-gray-200">{convexTest || "No test run yet"}</div>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-800 rounded-md text-xs font-mono text-gray-300 space-y-1">
        <div>Convex URL: {process.env.NEXT_PUBLIC_CONVEX_URL}</div>
        <div>Direct Users Query State: {testUsers ? 'loaded' : 'loading/error'}</div>
        <div>Direct Logos Query State: {testLogos ? 'loaded' : 'loading/error'}</div>
      </div>
    </div>
  );
} 
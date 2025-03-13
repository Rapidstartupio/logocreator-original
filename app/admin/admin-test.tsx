import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AdminTest() {
  const { user } = useUser();
  const [clerkTest, setClerkTest] = useState<string>("");
  const [convexTest, setConvexTest] = useState<string>("");
  
  // Direct Convex query test
  const testUsers = useQuery(api.admin.getAllUsers);
  
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
      // Test direct Convex query
      const directResult = testUsers ? "Direct Convex query successful" : "Direct query failed";
      
      // Test through API
      const result = await fetch("/api/admin/test-convex", {
        method: "POST",
      });
      const data = await result.json();
      
      setConvexTest(`${directResult}, API test: ${JSON.stringify(data)}`);
    } catch (error) {
      setConvexTest(`Convex error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Connection Tests</h2>
      
      <div className="space-y-2">
        <Button onClick={testClerk}>Test Clerk Connection</Button>
        <div className="text-sm">{clerkTest}</div>
      </div>

      <div className="space-y-2">
        <Button onClick={testConvex}>Test Convex Connection</Button>
        <div className="text-sm">{convexTest}</div>
      </div>
    </div>
  );
} 
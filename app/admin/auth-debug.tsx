"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

// Define a type for the results object
type AuthDebugResults = {
  clerkUser: {
    id: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  testQuery: unknown;
  initializeUser: unknown;
  // Add fields for additional debugging info
  authInfo?: unknown;
};

export default function AuthDebug() {
  const { user } = useUser();
  const convex = useConvex();
  const [results, setResults] = useState<AuthDebugResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test the direct connection between Clerk and Convex
  const testConnection = async () => {
    if (!user) {
      setError("No user is logged in");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Get the Clerk user ID
      const clerkUserId = user.id;
      console.log("Clerk User ID:", clerkUserId);
      
      // 2. Test the testQuery function which returns auth info
      const testQueryResult = await convex.query(api.admin.testQuery);
      console.log("Test Query Result:", testQueryResult);
      
      // 3. Get authentication info
      let authInfo = null;
      try {
        // Create a simple API route to get auth info
        const response = await fetch("/api/auth/debug");
        authInfo = await response.json();
        console.log("Auth Info:", authInfo);
      } catch (authErr) {
        console.error("Error getting auth info:", authErr);
        authInfo = { error: authErr instanceof Error ? authErr.message : "Unknown error" };
      }
      
      // 4. Try to initialize the user with the Clerk ID
      const initResult = await convex.mutation(api.admin.initializeUser, {
        userId: clerkUserId,
        email: user.primaryEmailAddress?.emailAddress || "unknown@example.com",
        isAdmin: true
      });
      console.log("Initialize User Result:", initResult);
      
      // Set the results
      setResults({
        clerkUser: {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName
        },
        testQuery: testQueryResult,
        initializeUser: initResult,
        authInfo
      });
    } catch (err) {
      console.error("Error testing connection:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Auth Debugging Tool</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Current User</h2>
        {user ? (
          <div>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
          </div>
        ) : (
          <p>No user is logged in</p>
        )}
      </div>
      
      <button 
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        onClick={testConnection}
        disabled={loading || !user}
      >
        {loading ? "Testing..." : "Test Clerk-Convex Connection"}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-3">Test Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Clerk User</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.clerkUser, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Auth Info</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.authInfo, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Test Query Result</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.testQuery, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Initialize User Result</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.initializeUser, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

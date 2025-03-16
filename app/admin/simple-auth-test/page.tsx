"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";

// Define a type for the results object
type TestResults = {
  testQuery?: unknown;
  initializeUser?: unknown;
  [key: string]: unknown;
};

export default function SimpleAuthTest() {
  const { user } = useUser();
  const convex = useConvex();
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)}: ${message}`]);
  };

  // Test the testQuery function which doesn't require admin access
  const runTestQuery = async () => {
    setLoading(true);
    setError(null);
    log("Running test query...");
    
    try {
      const result = await convex.query(api.admin.testQuery);
      log(`Test query result: ${JSON.stringify(result, null, 2)}`);
      setResults((prev: TestResults | null) => ({ ...prev, testQuery: result }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`Error in test query: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Initialize user with current Clerk user ID
  const initializeUser = async () => {
    if (!user) {
      setError("No user logged in");
      return;
    }

    setLoading(true);
    setError(null);
    log(`Initializing user with ID: ${user.id}`);
    
    try {
      const result = await convex.mutation(api.admin.initializeUser, {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "unknown@example.com",
        isAdmin: true
      });
      
      log(`User initialization result: ${JSON.stringify(result, null, 2)}`);
      setResults((prev: TestResults | null) => ({ ...prev, initializeUser: result }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`Error initializing user: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Auth Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Current User</h2>
        {user ? (
          <div>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
          </div>
        ) : (
          <p>No user logged in</p>
        )}
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={runTestQuery}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Running..." : "Run Test Query"}
        </button>
        
        <button
          onClick={initializeUser}
          disabled={loading || !user}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Initializing..." : "Initialize User"}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Logs</h2>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-48 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, i) => <div key={i}>{log}</div>)
            ) : (
              <p>No logs yet. Run a test to see results.</p>
            )}
          </div>
        </div>
        
        {results && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Results</h2>
            <pre className="bg-white p-3 rounded overflow-auto text-sm h-64">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

export default function SimpleTest() {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Test the testQuery function (should work if Convex is connected)
  const testQueryResult = useQuery(api.admin.testQuery);
  
  // Create a simple log function
  const log = (message: string) => {
    setLogMessages(prev => [message, ...prev]);
    console.log(message);
  };
  
  // Test the getRecentLogos query with different pagination options
  const testGetRecentLogos = async () => {
    log("Testing getRecentLogos with different pagination options...");
    
    try {
      // Test with no pagination options (should use defaults)
      const response1 = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'getRecentLogos',
          args: {}
        })
      });
      const data1 = await response1.json();
      log(`Test 1 (no pagination): ${JSON.stringify(data1, null, 2)}`);
      
      // Test with numItems = 5
      const response2 = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'getRecentLogos',
          args: {
            paginationOpts: {
              numItems: 5
            }
          }
        })
      });
      const data2 = await response2.json();
      log(`Test 2 (numItems=5): ${JSON.stringify(data2, null, 2)}`);
      
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Test the getUserStats query
  const testGetUserStats = async () => {
    log("Testing getUserStats...");
    
    try {
      const response = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'getUserStats'
        })
      });
      const data = await response.json();
      log(`getUserStats result: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Test the testQuery function directly
  const testBasicQuery = async () => {
    log("Testing basic testQuery function...");
    
    try {
      const response = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'testQuery'
        })
      });
      const data = await response.json();
      log(`testQuery result: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4 bg-white text-black">
      <h1 className="text-2xl font-bold mb-6 text-black">Convex API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-white border border-gray-300">
          <CardHeader className="bg-gray-100">
            <CardTitle className="text-black">Test Query Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40 text-black border border-gray-300">
              {JSON.stringify(testQueryResult, null, 2)}
            </pre>
            <p className="mt-2 text-black">
              {testQueryResult ? "✅ Basic Convex connection working" : "❌ Convex connection not working"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-300">
          <CardHeader className="bg-gray-100">
            <CardTitle className="text-black">Test API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testGetRecentLogos} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Test getRecentLogos
            </Button>
            <Button onClick={testGetUserStats} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Test getUserStats
            </Button>
            <Button onClick={testBasicQuery} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Test basic testQuery
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-white border border-gray-300">
        <CardHeader className="bg-gray-100">
          <CardTitle className="text-black">Log Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-black border border-gray-300">
            {logMessages.length === 0 ? (
              <p className="text-gray-600">No log messages yet. Run a test to see results.</p>
            ) : (
              <ul className="space-y-2">
                {logMessages.map((msg, i) => (
                  <li key={i} className="font-mono text-sm text-black">{msg}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";

type TestResult = {
  success: boolean;
  error?: string;
  [key: string]: unknown;
};

export default function DebugLogos() {
  const [testResults, setTestResults] = useState<{
    apiTests?: TestResult;
    directQuery?: TestResult;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // We'll use admin queries instead of testing queries since they're not yet generated
  // Comment out the getUserStats query that's breaking the page
  // const userStats = useQuery(api.admin.getUserStats);
  
  // Use default values instead
  const userStats = {
    success: false,
    stats: {
      totalUsers: 0,
      activeUsersToday: 0,
      newUsersToday: 0,
      totalLogosGenerated: 0
    },
    users: []
  };
  
  // Comment out the getRecentLogos query that's breaking the page
  // const recentLogos = useQuery(api.admin.getRecentLogos, {
  //   paginationOpts: {
  //     numItems: 3,
  //   }
  // });
  
  // Use default values instead
  const recentLogos = {
    success: false,
    error: "",
    data: [] as Array<{
      id: string;
      companyName: string;
      images: string[];
      timestamp: number;
      status: string;
      style: string;
      layout: string;
      businessType?: string;
      prompt?: string;
      additionalInfo?: string;
      generationTime?: number;
      modelUsed?: string;
      userId: string;
      userEmail: string;
    }>,
    continueCursor: null
  };
  
  // Run API route tests
  const runApiTests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/test-logos");
      const data = await response.json();
      setTestResults(prev => ({ ...prev, apiTests: data }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        apiTests: { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test the actual problematic query
  const testActualQuery = async () => {
    setIsLoading(true);
    try {
      // Test with null cursor
      const response = await fetch("/api/admin/test-direct-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryType: "getRecentLogos",
          args: {
            paginationOpts: {
              numItems: 5,
              cursor: undefined
            }
          }
        })
      });
      const data = await response.json();
      setTestResults(prev => ({ ...prev, directQuery: data }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        directQuery: { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Logo Query Diagnostics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Run API Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runApiTests} disabled={isLoading}>
              {isLoading ? "Running Tests..." : "Run API Tests"}
            </Button>
            
            {testResults.apiTests && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">API Test Results</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(testResults.apiTests, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Direct Query</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testActualQuery} disabled={isLoading}>
              {isLoading ? "Testing..." : "Test Direct Query"}
            </Button>
            
            {testResults.directQuery && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Direct Query Results</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(testResults.directQuery, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Convex Query Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">User Stats</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(userStats, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Recent Logos</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(recentLogos, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";

// Define types for API responses
type LogoData = {
  id?: string;
  companyName?: string;
  images?: string[];
  timestamp?: number;
  status?: string;
  style?: string;
  layout?: string;
  businessType?: string;
  userId?: string;
  userEmail?: string;
  [key: string]: unknown; // For any other properties
};

type UserStats = {
  stats?: {
    totalUsers?: number;
    activeUsers?: number;
    newUsers?: number;
    totalLogos?: number;
    [key: string]: unknown;
  };
  users?: Array<{
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  data?: LogoData[] | UserStats | Record<string, unknown>;
  page?: {
    items?: LogoData[];
    continueCursor?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown; // For any other properties
};

export default function TestQuery() {
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test Clerk users API
  const testClerkUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setResults({ success: true, data });
      console.log('Clerk users test results:', data);
    } catch (err) {
      console.error('Error fetching Clerk users:', err);
      setError(err instanceof Error ? err.message : String(err));
      setResults({ success: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  // Test Convex connection (this will likely fail until Convex is reconnected)
  const testConvexConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'testQuery',
          args: {}
        })
      });
      const data = await response.json();
      setResults(data);
      console.log('Convex connection test results:', data);
    } catch (err) {
      console.error('Error testing Convex connection:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Query Diagnostics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Clerk Users API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testClerkUsers} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Fetch Clerk Users'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Convex Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testConvexConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Convex'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Note: This test may fail until Convex is reconnected
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded border p-4">
              <pre className="text-xs">
                {JSON.stringify(results, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

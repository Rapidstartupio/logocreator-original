"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

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
};

export default function TestQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ApiResponse | null>(null);
  
  // Test direct query to Convex via API route
  const runDirectTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'getRecentLogos',
          args: {
            paginationOpts: {
              numItems: 5,
              cursor: undefined
            }
          }
        })
      });
      const data = await response.json();
      setResults(data);
      console.log('Direct test results:', data);
    } catch (err) {
      console.error('Error running direct test:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Test with null cursor
  const testWithNullCursor = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'getRecentLogos',
          args: {
            paginationOpts: {
              numItems: 5,
              cursor: null
            }
          }
        })
      });
      const data = await response.json();
      setResults(data);
      console.log('Null cursor test results:', data);
    } catch (err) {
      console.error('Error running null cursor test:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Test getUserStats
  const testGetUserStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/test-direct-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'getUserStats'
        })
      });
      const data = await response.json();
      setResults(data);
      console.log('getUserStats test results:', data);
    } catch (err) {
      console.error('Error running getUserStats test:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Test schema
  const testSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/test-schema');
      const data = await response.json();
      setResults(data);
      console.log('Schema test results:', data);
    } catch (err) {
      console.error('Error running schema test:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 bg-white text-black">
      <h1 className="text-2xl font-bold mb-6 text-black">API Test Query</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white border border-gray-300">
          <CardHeader className="bg-gray-100">
            <CardTitle className="text-black">Test Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDirectTest} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              Test Direct Query (getRecentLogos)
            </Button>
            <Button onClick={testWithNullCursor} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              Test With Null Cursor
            </Button>
            <Button onClick={testGetUserStats} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              Test getUserStats
            </Button>
            <Button onClick={testSchema} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              Test Schema
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-300">
          <CardHeader className="bg-gray-100">
            <CardTitle className="text-black">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-gray-300" />
                <Skeleton className="h-4 w-3/4 bg-gray-300" />
                <Skeleton className="h-4 w-1/2 bg-gray-300" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      
      {results && (
        <Card className="bg-white border border-gray-300">
          <CardHeader className="bg-gray-100">
            <CardTitle className="text-black">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-black border border-gray-300">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

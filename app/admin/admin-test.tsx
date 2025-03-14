"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface TestResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

interface TestState {
  clerkTest: TestResult | null;
  convexTest: TestResult | null;
  loading: boolean;
}

export default function AdminTest() {
  const { user } = useUser();
  const [testState, setTestState] = useState<TestState>({
    clerkTest: null,
    convexTest: null,
    loading: false
  });

  // Fetch admin data
  const userStats = useQuery(api.admin.getUserStats);
  const recentLogos = useQuery(api.admin.getRecentLogos, {
    // Provide default parameters for pagination and search
    limit: 10,
    cursor: undefined,
    searchTerm: "",
    userId: ""
  });

  // Test Clerk authentication
  const testClerk = async () => {
    setTestState(prev => ({ ...prev, loading: true }));
    try {
      if (!user) {
        throw new Error("No user found");
      }

      const result: TestResult = {
        success: true,
        message: "Clerk authentication successful",
        data: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "No email",
          firstName: user.firstName,
          lastName: user.lastName
        }
      };

      setTestState(prev => ({
        ...prev,
        clerkTest: result,
        loading: false
      }));
    } catch (error) {
      setTestState(prev => ({
        ...prev,
        clerkTest: {
          success: false,
          message: "Clerk authentication failed",
          error: error instanceof Error ? error.message : "Unknown error"
        },
        loading: false
      }));
    }
  };

  // Test Convex connection
  const testConvex = async () => {
    setTestState(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch("/api/admin/test-convex");
      const data = await response.json();

      setTestState(prev => ({
        ...prev,
        convexTest: {
          success: data.success,
          message: data.success ? "Convex connection successful" : "Convex connection failed",
          data: data.success ? data : undefined,
          error: data.error
        },
        loading: false
      }));
    } catch (error) {
      setTestState(prev => ({
        ...prev,
        convexTest: {
          success: false,
          message: "Convex connection failed",
          error: error instanceof Error ? error.message : "Unknown error"
        },
        loading: false
      }));
    }
  };

  // Helper to display test results
  const renderTestResult = (result: TestResult | null) => {
    if (!result) return null;

    return (
      <div className="space-y-2">
        <p className={`font-semibold ${result.success ? "text-green-600" : "text-red-600"}`}>
          {result.message}
        </p>
        {result.error && (
          <p className="text-red-600">Error: {result.error}</p>
        )}
        {result.data && (
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  // Helper to format JSON data
  const formatData = (data: unknown): string => {
    if (!data) return "No data available";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "Error formatting data";
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button 
                onClick={testClerk} 
                disabled={testState.loading}
                variant="outline"
              >
                Test Clerk Auth
              </Button>
              <Button 
                onClick={testConvex} 
                disabled={testState.loading}
                variant="outline"
              >
                Test Convex
              </Button>
            </div>

            <Tabs defaultValue="clerk" className="w-full">
              <TabsList>
                <TabsTrigger value="clerk">Clerk Test</TabsTrigger>
                <TabsTrigger value="convex">Convex Test</TabsTrigger>
                <TabsTrigger value="data">Live Data</TabsTrigger>
              </TabsList>

              <TabsContent value="clerk">
                <Card>
                  <CardContent className="pt-4">
                    {renderTestResult(testState.clerkTest)}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="convex">
                <Card>
                  <CardContent className="pt-4">
                    {renderTestResult(testState.convexTest)}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">User Stats</h3>
                      <ScrollArea className="h-[200px]">
                        <pre className="text-sm">
                          {formatData(userStats)}
                        </pre>
                      </ScrollArea>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Recent Logos</h3>
                      <ScrollArea className="h-[200px]">
                        <pre className="text-sm">
                          {formatData(recentLogos)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
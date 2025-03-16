"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for our data
type FixResult = {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
};

type ClerkUserData = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
};

type ConvexUserData = {
  _id: string;
  userId: string;
  email: string;
  totalLogosGenerated: number;
  lastActive: number;
  lastCompanyName: string;
  isAdmin: boolean;
  credits: number;
};

export default function ConnectionFixPage() {
  const { user } = useUser();
  const convex = useConvex();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);
  const [userData, setUserData] = useState<ClerkUserData | null>(null);
  const [convexData, setConvexData] = useState<ConvexUserData | null>(null);
  
  // Function to add a result to the results array
  const addResult = (result: FixResult) => {
    setResults(prev => [...prev, result]);
  };
  
  // Function to get Clerk user data
  const getClerkData = async () => {
    if (!user) {
      addResult({
        success: false,
        message: "No Clerk user found. Please sign in."
      });
      return false;
    }
    
    try {
      const userData: ClerkUserData = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl
      };
      
      setUserData(userData);
      addResult({
        success: true,
        message: "Successfully retrieved Clerk user data",
        details: userData as Record<string, unknown>
      });
      return true;
    } catch (error) {
      addResult({
        success: false,
        message: "Error getting Clerk user data",
        details: { error: error instanceof Error ? error.message : "Unknown error" }
      });
      return false;
    }
  };
  
  // Function to get Convex auth data
  const getConvexAuth = async () => {
    try {
      // Test the Convex connection
      const testResult = await convex.query(api.admin.testQuery);
      
      addResult({
        success: true,
        message: "Successfully connected to Convex",
        details: testResult as Record<string, unknown>
      });
      return true;
    } catch (error) {
      addResult({
        success: false,
        message: "Error connecting to Convex",
        details: { error: error instanceof Error ? error.message : "Unknown error" }
      });
      return false;
    }
  };
  
  // Function to check if the user exists in Convex
  const checkUserInConvex = async () => {
    if (!user) return false;
    
    try {
      // Try to find the user in Convex using the admin.findUser function
      const convexUser = await convex.query(api.admin.findUser, { userId: user.id });
      
      if (convexUser?.success && convexUser?.user) {
        setConvexData(convexUser.user as ConvexUserData);
        addResult({
          success: true,
          message: "User found in Convex database",
          details: convexUser.user as Record<string, unknown>
        });
        return true;
      } else {
        addResult({
          success: false,
          message: "User not found in Convex database",
          details: convexUser as Record<string, unknown>
        });
        return false;
      }
    } catch (error) {
      addResult({
        success: false,
        message: "Error checking user in Convex",
        details: { error: error instanceof Error ? error.message : "Unknown error" }
      });
      return false;
    }
  };
  
  // Function to initialize the user in Convex
  const initializeUserInConvex = async () => {
    if (!user) return false;
    
    try {
      // Initialize the user in Convex
      const initResult = await convex.mutation(api.admin.initializeUser, {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "unknown@example.com",
        isAdmin: true
      });
      
      addResult({
        success: true,
        message: "User initialized in Convex",
        details: initResult as Record<string, unknown>
      });
      return true;
    } catch (error) {
      addResult({
        success: false,
        message: "Error initializing user in Convex",
        details: { error: error instanceof Error ? error.message : "Unknown error" }
      });
      return false;
    }
  };
  
  // Function to run all the fix steps
  const runFix = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // Step 1: Get Clerk data
      const hasClerkData = await getClerkData();
      if (!hasClerkData) {
        setLoading(false);
        return;
      }
      
      // Step 2: Test Convex connection
      const hasConvexConnection = await getConvexAuth();
      if (!hasConvexConnection) {
        setLoading(false);
        return;
      }
      
      // Step 3: Check if user exists in Convex
      const userExistsInConvex = await checkUserInConvex();
      
      // Step 4: If user doesn't exist, initialize them
      if (!userExistsInConvex) {
        await initializeUserInConvex();
      }
      
      // Step 5: Check user again to confirm fix
      if (!userExistsInConvex) {
        await checkUserInConvex();
      }
      
      addResult({
        success: true,
        message: "Fix process completed"
      });
    } catch (error) {
      addResult({
        success: false,
        message: "Error during fix process",
        details: { error: error instanceof Error ? error.message : "Unknown error" }
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard Connection Fix</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
              <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            </div>
          ) : (
            <p>No user is logged in. Please sign in to continue.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <Button 
          onClick={runFix} 
          disabled={loading || !user}
          className="w-full"
        >
          {loading ? "Running Fix..." : "Run Connection Fix"}
        </Button>
      </div>
      
      {results.length > 0 && (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Fix Results</TabsTrigger>
            <TabsTrigger value="clerk">Clerk Data</TabsTrigger>
            <TabsTrigger value="convex">Convex Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fix Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded ${result.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'}`}
                    >
                      <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.message}
                      </p>
                      {result.details && (
                        <pre className="mt-2 bg-white p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clerk">
            <Card>
              <CardHeader>
                <CardTitle>Clerk User Data</CardTitle>
              </CardHeader>
              <CardContent>
                {userData ? (
                  <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                ) : (
                  <p>No Clerk data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="convex">
            <Card>
              <CardHeader>
                <CardTitle>Convex User Data</CardTitle>
              </CardHeader>
              <CardContent>
                {convexData ? (
                  <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
                    {JSON.stringify(convexData, null, 2)}
                  </pre>
                ) : (
                  <p>No Convex data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

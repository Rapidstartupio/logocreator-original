"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

export default function SimpleTest() {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Create a simple log function
  const log = (message: string) => {
    setLogMessages(prev => [message, ...prev]);
    console.log(message);
  };
  
  // Test Clerk authentication
  const testClerkAuth = () => {
    log("Testing Clerk authentication...");
    
    if (!isLoaded) {
      log("Clerk is still loading");
      return;
    }
    
    if (isSignedIn && user) {
      log(`Successfully authenticated as ${user.primaryEmailAddress?.emailAddress}`);
      log(`User ID: ${user.id}`);
      log(`Name: ${user.firstName} ${user.lastName}`);
      log(`Created at: ${user.createdAt?.toLocaleString()}`);
    } else {
      log("Not authenticated");
    }
  };
  
  // Test API endpoint directly
  const testApiEndpoint = async () => {
    log("Testing API endpoint...");
    
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.users) {
        log(`Successfully fetched ${data.users.length} users from API`);
        if (data.users.length > 0) {
          log(`First user: ${data.users[0]?.firstName || 'No name'} (${data.users[0]?.emailAddresses?.[0]?.emailAddress || 'No email'})`);
          log(`User data structure: ${JSON.stringify(data.users[0], null, 2)}`);
        } else {
          log("No users returned from API");
        }
      } else if (data.error) {
        log(`API Error: ${data.error}`);
      } else {
        log(`Unknown API response format: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      log(`Error calling API: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Direct test with Clerk client
  const testDirectClerk = async () => {
    log("Testing direct Clerk client access...");
    
    try {
      // This is just to check if we're authenticated
      if (!isSignedIn || !user) {
        log("Not authenticated - can't test Clerk client directly");
        return;
      }
      
      log(`Current user: ${user.id} (${user.primaryEmailAddress?.emailAddress})`);
      log("To fetch all users, we need to use the API endpoint");
      log("Click 'Test API Endpoint' to check if the API is working");
    } catch (error) {
      log(`Error with Clerk client: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Clerk Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isSignedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isLoaded ? (isSignedIn ? 'Authenticated' : 'Not Authenticated') : 'Loading...'}</span>
            </div>
            
            {isSignedIn && user && (
              <div className="mt-4 bg-gray-100 p-3 rounded text-sm">
                <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testClerkAuth} className="w-full">
              Test Clerk Authentication
            </Button>
            
            <Button onClick={testApiEndpoint} className="w-full">
              Test API Endpoint
            </Button>
            
            <Button onClick={testDirectClerk} className="w-full">
              Test Direct Clerk
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p><strong>Clerk Domain:</strong> {process.env.NEXT_PUBLIC_CLERK_DOMAIN || 'Not set'}</p>
              <p><strong>Convex URL:</strong> {process.env.NEXT_PUBLIC_CONVEX_URL ? 'Set' : 'Not set'}</p>
              <p><strong>Mode:</strong> {process.env.NODE_ENV}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-[300px] overflow-y-auto">
            {logMessages.length === 0 ? (
              <p>No logs yet. Run a test to see results.</p>
            ) : (
              logMessages.map((msg, i) => (
                <div key={i} className="mb-1">
                  &gt; {msg}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

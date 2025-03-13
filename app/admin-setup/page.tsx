"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminSetup() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const setAdminRole = async () => {
    try {
      setStatus("Setting admin role...");
      setError("");
      
      const response = await fetch("/api/set-admin", {
        method: "POST",
        credentials: "include",
      });

      const text = await response.text();
      
      if (response.ok) {
        setStatus(text);
        // Reload the page after 2 seconds to refresh the session
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      } else {
        setError(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const currentEmail = user?.emailAddresses[0]?.emailAddress;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
      
      <div className="space-y-4">
        <div>
          <p>Current user: {currentEmail}</p>
          <p>Is admin email: {currentEmail === "admin@admin.com" ? "Yes" : "No"}</p>
        </div>

        <Button 
          onClick={setAdminRole}
          disabled={currentEmail !== "admin@admin.com"}
        >
          Set Admin Role
        </Button>

        {status && (
          <div className="text-green-500">
            {status}
          </div>
        )}

        {error && (
          <div className="text-red-500">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
} 
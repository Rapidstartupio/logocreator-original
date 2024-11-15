import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function APIKeyDialog() {
  const { user } = useUser();
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiKey(localStorage.getItem("userAPIKey") || "");
    }
  }, []);

  const handleSave = async () => {
    if (apiKey) {
      localStorage.setItem("userAPIKey", apiKey);
    } else {
      localStorage.removeItem("userAPIKey");
    }
    
    // Update user metadata
    await user?.update({
      unsafeMetadata: {
        hasApiKey: Boolean(apiKey),
        ...(apiKey ? { remaining: "BYOK" } : { remaining: 3 }),
      },
    });

    window.location.reload(); // Refresh to update UI state
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          API Key Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Together API Key Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              API Key (Optional)
            </label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Together API key"
              type="password"
              className="mt-2"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter your Together API key to use unlimited generations
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
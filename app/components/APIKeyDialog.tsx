import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/hooks/use-toast";

export function APIKeyDialog() {
  const { user } = useUser();
  const [apiKey, setApiKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiKey(localStorage.getItem("userAPIKey") || "");
    }
  }, []);

  useEffect(() => {
    // Check for pending logo data after successful sign-up
    const pendingLogoData = localStorage.getItem('pendingLogoData')
    if (pendingLogoData && user) {
      const logoData = JSON.parse(pendingLogoData);
      
      // Send data to LeadConnector
      fetch('/api/leadconnector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: logoData.companyName,
          businessType: logoData.additionalInfo,
        }),
      }).catch(error => {
        console.error('Error sending data to LeadConnector:', error);
      });

      // Clear the pending data
      localStorage.removeItem('pendingLogoData')
    }
  }, [user])

  const handleSave = async () => {
    try {
      if (apiKey) {
        localStorage.setItem("userAPIKey", apiKey);
      } else {
        localStorage.removeItem("userAPIKey");
      }
      
      await user?.update({
        unsafeMetadata: {
          hasApiKey: Boolean(apiKey),
          ...(apiKey ? { remaining: "BYOK" } : { remaining: 3 }),
        },
      });

      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save API key settings",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="mr-2"
        >
          API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Together API Key Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium leading-none">
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
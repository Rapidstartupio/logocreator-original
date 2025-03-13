import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { useUser } from "@clerk/nextjs";

const CREDIT_BUNDLES = [
  { credits: 10, price: 5 },
  { credits: 25, price: 10 },
  { credits: 60, price: 20 },
];

export function CreditsDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  // Check and initialize metadata if needed
  useEffect(() => {
    const initializeMetadata = async () => {
      if (!user) return;

      const metadata = user.unsafeMetadata || {};
      let needsUpdate = false;

      // Check if required fields exist and are of correct type
      if (metadata.remaining === undefined || typeof metadata.remaining !== 'number') {
        metadata.remaining = 0; // Initialize with 0 credits for existing users
        needsUpdate = true;
      }

      if (metadata.hasApiKey === undefined) {
        metadata.hasApiKey = false;
        needsUpdate = true;
      }

      // Update user if needed
      if (needsUpdate) {
        try {
          await user.update({
            unsafeMetadata: metadata
          });
        } catch (error) {
          console.error('Error initializing user metadata:', error);
        }
      }
    };

    initializeMetadata();
  }, [user]);

  const handlePurchase = async (credits: number, price: number) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credits,
          price,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get credits safely, defaulting to 0 if metadata is missing
  const currentCredits = typeof user?.unsafeMetadata?.remaining === 'number' 
    ? user.unsafeMetadata.remaining 
    : 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm text-white hover:text-gray-300">
          {currentCredits} credits
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose a credit bundle to generate more logos
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {CREDIT_BUNDLES.map((bundle) => (
            <div
              key={bundle.credits}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{bundle.credits} Credits</p>
                <p className="text-sm text-gray-500">${bundle.price}</p>
              </div>
              <Button
                onClick={() => handlePurchase(bundle.credits, bundle.price)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Purchase"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
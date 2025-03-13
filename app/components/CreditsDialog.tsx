import { useState } from "react";
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm text-white hover:text-gray-300">
          {String(user?.unsafeMetadata?.remaining || 3)} credits
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
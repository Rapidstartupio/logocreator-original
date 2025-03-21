// import Image from "next/image";
// import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { domain } from "@/app/lib/domain";
import { APIKeyDialog } from "./APIKeyDialog";
import { CreditsDialog } from "./CreditsDialog";
import { HistoryDrawer } from "./HistoryDrawer";
import type { LogoHistory } from "./HistoryDrawer";

export default function Header({ className }: { className?: string }) {
  const { user } = useUser();

  // Function to determine what to display for credits/API key status
  const getCreditsDisplay = () => {
    const metadata = user?.unsafeMetadata;
    if (!metadata) return null;

    // If user has their own API key and hasApiKey is true
    if (metadata.hasApiKey === true) {
      return <p>Your API key</p>;
    }

    // If user is using rate-limited credits, show the CreditsDialog
    return <CreditsDialog />;
  };

  const handleHistorySelect = (historyItem: LogoHistory) => {
    // Populate the form with historical data
    localStorage.setItem('pendingLogoData', JSON.stringify({
      companyName: historyItem.settings.companyName,
      layout: historyItem.settings.layout,
      style: historyItem.settings.style,
      primaryColor: historyItem.settings.primaryColor,
      backgroundColor: historyItem.settings.backgroundColor,
      additionalInfo: historyItem.settings.additionalInfo,
      generatedImages: historyItem.images,
    }));
    // Reload the page to apply the changes
    window.location.reload();
  };

  return (
    <header className={`relative w-full ${className}`}>
      <div className="flex items-center justify-between bg-[#343434] px-4 py-2 md:mt-4">
        {/* Logo - left on mobile, centered on larger screens */}
        <div className="flex flex-grow justify-start xl:justify-center">
          {/*<Link href="https://dub.sh/together-ai" className="flex items-center">
            <Image
              src="together-ai-logo1.svg"
              alt="together.ai"
              width={400}
              height={120}
              className="w-[220px] md:w-[330px] lg:w-[390px]"
              priority
            />
          </Link>*/}
        </div>
        {/* Credits Section */}
        <div className="absolute right-8 flex items-center space-x-2 md:top-20 lg:top-8 z-10">
          <SignedOut>
            <SignInButton
              mode="modal"
              signUpForceRedirectUrl={domain}
              forceRedirectUrl={domain}
            />
          </SignedOut>
          <SignedIn>
            {getCreditsDisplay()}
            <div className="flex items-center">
              <HistoryDrawer onSelectHistory={handleHistorySelect} />
              <APIKeyDialog />
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonPopoverCard: "py-2",
                    userButtonPopoverActions: "py-2",
                    userButtonPopoverFooter: "hidden"
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

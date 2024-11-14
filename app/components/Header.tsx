import Image from "next/image";
import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { domain } from "@/app/lib/domain";

export default function Header({ className }: { className: string }) {
  const { user } = useUser();

  return (
    <header className={`relative w-full ${className}`}>
      <div className="flex items-center justify-between bg-[#343434] px-4 py-2 md:mt-4">
        {/* Logo - left on mobile, centered on larger screens */}
        <div className="flex flex-grow justify-start xl:justify-center">
          <Link href="https://www.together.ai" className="flex items-center">
            <Image
              src="together-ai-logo1.svg"
              alt="together.ai"
              width={450}
              height={120}
              className="w-[233px] md:w-[350px] lg:w-[450px]"
              priority
            />
          </Link>
        </div>
        {/* Credits Section */}
        <div className="absolute right-8 flex items-center space-x-2 md:top-20 lg:top-8">
          <SignedOut>
            <SignInButton
              mode="modal"
              signUpForceRedirectUrl={domain}
              forceRedirectUrl={domain}
            />
          </SignedOut>
          <SignedIn>
            <p>Credits: {`${user?.unsafeMetadata.remaining ?? 3}`}</p>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

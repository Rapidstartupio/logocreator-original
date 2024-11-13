import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Header({ className }: { className: string }) {
  const { user } = useUser();

  return (
    <header className={`relative w-full ${className}`}>
      <div className="flex items-center justify-between bg-[#343434] px-4 py-2 md:mt-4">
        {/* Logo - left on mobile, centered on larger screens */}
        <div className="flex flex-grow justify-start md:justify-center">
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
        <div className="absolute right-8 flex items-center space-x-2">
          {/* <div className="flex items-center">
            <span className="hidden text-sm text-gray-400 lg:block">
              Credits:
            </span>
            <span className="ml-0.5 hidden text-sm text-gray-300 lg:block">
              3
            </span>
          </div>
          <Image
            src="/insan.png"
            alt="Insan"
            width={36}
            height={36}
            className="h-8 w-8 rounded-full border border-black bg-gray-600 md:h-9 md:w-9"
          /> */}

          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <p>Remaining credits: {`${user?.unsafeMetadata.remaining ?? 3}`}</p>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

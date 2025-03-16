"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <SignUp
        path="/sign-up"
        appearance={{
          elements: {
            formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600",
            card: "bg-gray-800 border-gray-700",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "bg-gray-700 border-gray-600 hover:bg-gray-600",
            socialButtonsBlockButtonText: "text-white",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-gray-700 border-gray-600 text-white",
            footerActionText: "text-gray-400",
            footerActionLink: "text-indigo-500 hover:text-indigo-400",
          },
        }}
        redirectUrl="/dashboard"
        routing="path"
        signInUrl="/sign-in"
      />

      {/* Note: The Clerk SignUp component doesn't have afterSignUpComplete or signUpUrl props */}
      {/* We need to implement a different approach to handle post-signup actions */}
    </div>
  );
}
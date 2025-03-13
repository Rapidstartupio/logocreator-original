import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <SignIn
        path="/sign-in"
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
        afterSignInUrl="/dashboard"
        routing="path"
        signUpUrl="/sign-up"
      />
    </div>
  );
} 
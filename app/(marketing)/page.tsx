import LogoQuestionnaire from "@/components/logoQuestionnaire"
import Footer from "@/components/Footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-white text-xl font-bold">
            Logo AI
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <div className="pt-16 pb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Create Your Perfect Logo
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-8">
            Design a professional logo in minutes with our AI-powered logo generator. 
            Try it now for free.
          </p>
        </div>
        <LogoQuestionnaire />
      </div>
      <Footer />
    </main>
  )
} 
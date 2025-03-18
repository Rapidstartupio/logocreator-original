"use client"

import LogoQuestionnaire from "../components/logoQuestionnaire"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignInButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Image from "next/image"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function LandingPage() {
  const scrollToQuestionnaire = () => {
    const element = document.getElementById('logo-questionnaire');
    element?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="LogoX" 
              width={120} 
              height={120} 
              className="w-[120px] h-[60px]" 
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4" id="logo-questionnaire">
        <div className="pt-16 pb-8 text-center">
          <p className="text-lg italic text-gray-400 mb-4">
            Surprised by expensive logo designers?
          </p>
          <h1 className="text-5xl font-bold text-white mb-6">
            Design A Logo In 30 Seconds With AI.
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-8">
            Designing a logo doesn&apos;t have to be expensive or difficult. Using AI you can get a unique logo that 
            fits your brand and personality so you can have a running start.
          </p>
        </div>
        <LogoQuestionnaire />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 hidden">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Get A Stunning Logo You&apos;ll Love
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto mb-12">
            AI will help you generate beautiful and unique logos for your website so you can see how your new business will become a reality
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <Image src="/example1.png" alt="Timeless Designs" width={200} height={200} className="mx-auto" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">✓ Timeless Designs</h3>
              <p className="text-gray-400">AI will help you generate beautiful and unique logos for your website so you can see how your new brand can become a reality</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <Image src="/example2.png" alt="Zero Computer Skills Needed" width={200} height={200} className="mx-auto" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">✓ Zero Computer Skills Needed</h3>
              <p className="text-gray-400">AI will help you generate beautiful and unique logos for your website so you can see how your new brand can become a reality</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <Image src="/example3.png" alt="Works For All Businesses" width={200} height={200} className="mx-auto" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">✓ Works For All Businesses</h3>
              <p className="text-gray-400">AI will help you generate beautiful and unique logos for your website so you can see how your new brand can become a reality</p>
            </div>
          </div>

          <Button 
            size="lg"
            onClick={scrollToQuestionnaire}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg px-8 h-16"
          >
            Create Your Logo Now
          </Button>
        </div>
      </section>

      {/* Why Use LogoX Section */}
      <section className="container mx-auto px-4 py-20 border-t border-gray-800 hidden">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Why use LogoX?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <Image src="/feature1.png" alt="AI Logo Generator" width={300} height={200} className="mx-auto" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">AI Logo Generator For Instant Designs</h3>
            <p className="text-gray-400">Automatically generate dozens of unique logo designs, have our AI design your logo for your business in an instant!</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <Image src="/feature2.png" alt="Customize Your Logo" width={300} height={200} className="mx-auto" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Easily Customize Your Dream Logo</h3>
            <p className="text-gray-400">Customize colors icons and more to make your logo designs based on your exact needs</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <Image src="/feature3.png" alt="Launch Your Brand" width={300} height={200} className="mx-auto" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Launch Your Unique Brand & Company</h3>
            <p className="text-gray-400">Download your logo instantly with source files and commercial rights included - ready for social media and your website!</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 border-t border-gray-800 hidden">
        <h2 className="text-4xl font-bold text-white text-center mb-6">How It Works</h2>
        <p className="text-gray-400 text-xl text-center max-w-4xl mx-auto mb-16">
          Our AI-powered logo generator will help you launch your own unique logo fast, easy and free of charge. Our AI combines creativity and 
          robotic precision - turning your idea into unforgettable logos that will make an impact on potential customers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <span className="text-purple-500 text-sm font-semibold">Step 1</span>
              <h3 className="text-white text-xl font-semibold mb-4">Explain Idea</h3>
              <p className="text-gray-400">Just answer a few simple questions about your business and we will generate custom logo designs for you.</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <span className="text-purple-500 text-sm font-semibold">Step 2</span>
              <h3 className="text-white text-xl font-semibold mb-4">Customize Your Logo</h3>
              <p className="text-gray-400">Using our custom options within the dashboard you can easily fine-tune your dream logo design</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <span className="text-purple-500 text-sm font-semibold">Step 3</span>
              <h3 className="text-white text-xl font-semibold mb-4">Launch Your Company</h3>
              <p className="text-gray-400">Download your logo instantly with source files - ready for social media and your website!</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={scrollToQuestionnaire}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg px-8 h-16"
          >
            Create Your Logo Now
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20 border-t border-gray-800 hidden">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-gray-800">
              <AccordionTrigger className="text-white hover:text-purple-400">Do you have any monthly plans or fees?</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                NO, you can create a professional-quality logo 100% FREE of charge! In addition to your design, you&apos;ll receive an array of 
                high-resolution file formats such as vector, PNG and JPG in full color - so that your brand shines through with every use.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-gray-800">
              <AccordionTrigger className="text-white hover:text-purple-400">Can I edit a logo after I create it?</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                YES, you can
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-gray-800">
              <AccordionTrigger className="text-white hover:text-purple-400">Do you use templates?</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                We use a combination of proven designs as a framework & artificial intelligence to create unique logo&apos;s that are actually 
                usable, not all logos are created equal so we have spent a lot of time to make it just right.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-gray-800">
              <AccordionTrigger className="text-white hover:text-purple-400">Can I download my free logo?</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                YES, We also include the source files of your logo such as PNG, JPG, SVG and more, just follow the instructions
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="border-gray-800">
              <AccordionTrigger className="text-white hover:text-purple-400">Do I own the copyright & commercial rights?</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                YES, you receive all rights to the logo of your choice!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="border-gray-800">
              <AccordionTrigger className="text-white hover:text-purple-400">Can others recreate my logo?</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                NO.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="LogoX" 
                width={80} 
                height={80} 
                className="w-[80px] h-[80px]" 
                style={{ objectFit: 'contain' }}
              />
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} LogoX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, DownloadIcon } from 'lucide-react'
import Image from "next/image"
import { SignInButton, useUser } from "@clerk/nextjs"

type Question = {
  id: number
  title: string
  type: "input" | "number" | "layout" | "style" | "color" | "textarea"
}

interface FormData {
  companyName: string
  numberImages: "1" | "3" | "6"
  layout: "icon" | "horizontal" | "stacked"
  style: "tech" | "flashy" | "modern" | "playful" | "abstract" | "minimal"
  primaryColor: string
  backgroundColor: string
  additionalInfo: string
  generatedLogoUrl?: string
}

export default function LogoQuestionnaire() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    numberImages: "1",
    layout: "icon",
    style: "tech",
    primaryColor: "blue",
    backgroundColor: "white",
    additionalInfo: "",
  })

  const { isSignedIn } = useUser();

  // Add useEffect to ensure background color is always white
  useEffect(() => {
    setFormData(prev => ({ ...prev, backgroundColor: "White" }));
  }, []);

  const questions: Question[] = [
    { id: 0, title: "What's Your Company Name?", type: "input" },
    { id: 1, title: "Choose Your Layout", type: "layout" },
    { id: 2, title: "Select Your Style", type: "style" },
    { id: 3, title: "Pick Your Colors", type: "color" },
    { id: 4, title: "Which of the following best describes your business:", type: "textarea" },
  ]

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const layouts = [
    { name: "Icon", icon: "/solo.svg" },
    { name: "Horizontal", icon: "/side.svg" },
    { name: "Stacked", icon: "/stack.svg" },
  ]

  const logoStyles = [
    { name: "tech", icon: "/tech.svg" },
    { name: "flashy", icon: "/flashy.svg" },
    { name: "modern", icon: "/modern.svg" },
    { name: "playful", icon: "/playful.svg" },
    { name: "abstract", icon: "/abstract.svg" },
    { name: "minimal", icon: "/minimal.svg" },
  ]


  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setDirection(1)
      setCurrentQuestion((prev) => prev + 1)
    } else {
      handleGenerate()
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setDirection(-1)
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/demo/generate-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          selectedLayout: formData.layout,
          selectedStyle: formData.style,
          selectedPrimaryColor: formData.primaryColor,
          selectedBackgroundColor: formData.backgroundColor,
          additionalInfo: formData.additionalInfo,
          numberOfImages: 1
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({
          ...prev,
          generatedLogoUrl: `data:image/png;base64,${data[0]}`
        }))
        setShowResult(true)
      } else {
        const errorText = await res.text()
        console.error('Failed to generate demo logo:', errorText)
      }
    } catch (error) {
      console.error('Error generating demo logo:', error)
    }
    setIsGenerating(false)
  }

  const QuestionContent = ({ question }: { question: Question }) => {
    switch (question.type) {
      case "input":
        return (
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Enter your company name:</label>
            <Input
              placeholder="Enter your company name"
              value={formData.companyName}
              onChange={(e) => {
                e.preventDefault()
                const newValue = e.target.value
                setFormData(prev => ({
                  ...prev,
                  companyName: newValue
                }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && formData.companyName.trim()) {
                  e.preventDefault();
                  handleNext();
                }
              }}
              className="text-lg p-6 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              autoFocus
            />
          </div>
        )
      case "number":
        return (
          <div className="grid grid-cols-3 gap-4">
            {["1", "3", "6"].map((num) => (
              <button
                key={num}
                onClick={() => setFormData({ ...formData, numberImages: num as "1" | "3" | "6" })}
                className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                  formData.numberImages === num
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-gray-700 hover:border-blue-500/50"
                }`}
              >
                {num}
                <div className="text-sm text-gray-400 mt-2">{num === "1" ? "Single" : `${num} Images`}</div>
              </button>
            ))}
          </div>
        )
      case "layout":
        return (
          <div className="grid grid-cols-3 gap-4">
            {layouts.map((layout) => (
              <button
                key={layout.name}
                onClick={() => setFormData({ ...formData, layout: layout.name as FormData["layout"] })}
                className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                  formData.layout === layout.name 
                    ? "border-blue-500 bg-blue-500/20" 
                    : "border-gray-700 hover:border-blue-500/50"
                }`}
              >
                <div className="h-12 flex items-center justify-center">
                  <Image
                    src={layout.icon}
                    alt={layout.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-sm text-gray-400 mt-2 capitalize">{layout.name}</div>
              </button>
            ))}
          </div>
        )
      case "style":
        return (
          <div className="grid grid-cols-3 gap-4">
            {logoStyles.map((style) => (
              <button
                key={style.name}
                onClick={() => setFormData({ ...formData, style: style.name as FormData["style"] })}
                className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                  formData.style === style.name 
                    ? "border-blue-500 bg-blue-500/20" 
                    : "border-gray-700 hover:border-blue-500/50"
                }`}
              >
                <div className="h-12 flex items-center justify-center">
                  <Image
                    src={style.icon}
                    alt={style.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-sm text-gray-400 mt-2 capitalize">{style.name}</div>
              </button>
            ))}
          </div>
        )
      case "color":
        return (
          <div className="space-y-6">
            {/* Primary Color */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-[#6F6F6F]">
                Choose Your Primary Color
              </label>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  {
                    name: "Blue",
                    shades: ["bg-blue-400", "bg-blue-500", "bg-blue-600", "bg-blue-700"]
                  },
                  {
                    name: "Red",
                    shades: ["bg-red-400", "bg-red-500", "bg-red-600", "bg-red-700"]
                  },
                  {
                    name: "Green",
                    shades: ["bg-green-400", "bg-green-500", "bg-green-600", "bg-green-700"]
                  },
                  {
                    name: "Yellow",
                    shades: ["bg-yellow-400", "bg-yellow-500", "bg-yellow-600", "bg-yellow-700"]
                  }
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setFormData({ ...formData, primaryColor: color.name })}
                    className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                      formData.primaryColor === color.name
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-gray-700 hover:border-blue-500/50"
                    }`}
                  >
                    <div className="h-12 flex items-center justify-center">
                      <div className="w-12 h-12 grid grid-cols-2 grid-rows-2">
                        {color.shades.map((shade, index) => (
                          <div key={index} className={`${shade}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2 capitalize">{color.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color - Hidden */}
            <div className="hidden" />
          </div>
        )
      case "textarea":
        return (
          <div className="space-y-4">
            <label className="hidden text-sm text-gray-400">Which of the following best describes your business:</label>
            <div className="grid gap-3">
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  className="text-blue-500"
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    additionalInfo: "Physical retail store selling everyday products"
                  }))}
                />
                <span className="text-sm text-gray-300">Brick & Mortar: I have a physical location where I sell products and/or services</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  className="text-blue-500"
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    additionalInfo: "Online store selling electronics and gadgets"
                  }))}
                />
                <span className="text-sm text-gray-300">eCommerce: selling products online</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  className="text-blue-500"
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    additionalInfo: "Educational content and online courses"
                  }))}
                />
                <span className="text-sm text-gray-300">Information Products: books, courses, etc</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  className="text-blue-500"
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    additionalInfo: "Affiliate marketing business promoting tech products"
                  }))}
                />
                <span className="text-sm text-gray-300">Affiliate Marketing: selling other companies products & services</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  className="text-blue-500"
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    additionalInfo: "Software development agency"
                  }))}
                />
                <span className="text-sm text-gray-300">Other: software, real estate agent, blogging, agency, etc</span>
              </label>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-sm text-gray-400">Or enter custom information:</label>
              <textarea
                placeholder="Enter any additional information or requirements..."
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                className="w-full min-h-[150px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (showResult) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
        <div className="relative mb-8">
          <img
            src={formData.generatedLogoUrl || "/placeholder.svg"}
            alt="Generated Logo"
            className="w-64 h-64 rounded-xl shadow-lg"
          />
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleGenerate}
            className="absolute -top-2 -right-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-4">
          <Button 
            size="lg"
            variant="outline"
            className="font-semibold bg-gray-800 border-gray-700 hover:bg-gray-700"
            onClick={handleGenerate}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          {isSignedIn ? (
            <Button 
              size="lg" 
              className="font-semibold bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (formData.generatedLogoUrl) {
                  localStorage.setItem('pendingLogoData', JSON.stringify({
                    ...formData,
                    timestamp: Date.now()
                  }));
                  window.location.href = "/dashboard";
                }
              }}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download Logo
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button 
                size="lg" 
                className="font-semibold bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (formData.generatedLogoUrl) {
                    localStorage.setItem('pendingLogoData', JSON.stringify({
                      ...formData,
                      timestamp: Date.now()
                    }));
                  }
                }}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Claim Your Download
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
      <div className="w-full max-w-2xl">
        {/* Render the last question first when it's active */}
        {currentQuestion === questions.length - 1 ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">{questions[currentQuestion].title}</h2>
              <div className="flex gap-1 justify-center">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 w-8 rounded-full transition-colors ${
                      index === currentQuestion ? "bg-blue-500" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm text-gray-400">Which of the following best describes your business:</label>
              <div className="grid gap-3">
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="businessType"
                    className="text-blue-500"
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      additionalInfo: "Physical retail store selling everyday products"
                    }))}
                  />
                  <span className="text-sm text-gray-300">Brick & Mortar: I have a physical location where I sell products and/or services</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="businessType"
                    className="text-blue-500"
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      additionalInfo: "Online store selling electronics and gadgets"
                    }))}
                  />
                  <span className="text-sm text-gray-300">eCommerce: selling products online</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="businessType"
                    className="text-blue-500"
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      additionalInfo: "Educational content and online courses"
                    }))}
                  />
                  <span className="text-sm text-gray-300">Information Products: books, courses, etc</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="businessType"
                    className="text-blue-500"
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      additionalInfo: "Affiliate marketing business promoting tech products"
                    }))}
                  />
                  <span className="text-sm text-gray-300">Affiliate Marketing: selling other companies products & services</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="businessType"
                    className="text-blue-500"
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      additionalInfo: "Software development agency"
                    }))}
                  />
                  <span className="text-sm text-gray-300">Other: software, real estate agent, blogging, agency, etc</span>
                </label>
              </div>

              <div className="mt-6 space-y-2">
                <label className="text-sm text-gray-400">Or enter custom information:</label>
                <textarea
                  placeholder="Enter any additional information or requirements..."
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  className="w-full min-h-[150px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{questions[currentQuestion].title}</h2>
                <div className="flex gap-1 justify-center">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 w-8 rounded-full transition-colors ${
                        index === currentQuestion ? "bg-blue-500" : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="w-full">
                  <QuestionContent question={questions[currentQuestion]} />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="flex gap-4 justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className={`${currentQuestion === 0 ? "invisible" : ""} bg-gray-800 border-gray-700 hover:bg-gray-700 text-white`}
          >
            Back
          </Button>
          <Button
            size="lg"
            onClick={handleNext}
            disabled={isGenerating}
            className="min-w-[140px] font-semibold bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating
              </>
            ) : currentQuestion === questions.length - 1 ? (
              "Generate Logo"
            ) : (
              "Next Question"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
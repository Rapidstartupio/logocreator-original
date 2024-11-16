"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Loader2, DownloadIcon } from 'lucide-react'
import Image from "next/image"
import { useRouter } from 'next/navigation'

type Question = {
  id: number
  title: string
  type: "input" | "number" | "layout" | "style" | "color" | "textarea"
}

interface FormData {
  companyName: string
  numberImages: "1" | "3" | "6"
  layout: "solo" | "side" | "stack"
  style: "tech" | "flashy" | "modern" | "playful" | "abstract" | "minimal"
  primaryColor: string
  backgroundColor: string
  additionalInfo: string
  generatedLogoUrl?: string
}

export default function LogoQuestionnaire() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    numberImages: "1",
    layout: "solo",
    style: "tech",
    primaryColor: "blue",
    backgroundColor: "white",
    additionalInfo: "",
  })

  const questions: Question[] = [
    { id: 0, title: "What's Your Company Name?", type: "input" },
    { id: 1, title: "How Many Images Would You Like?", type: "number" },
    { id: 2, title: "Choose Your Layout", type: "layout" },
    { id: 3, title: "Select Your Style", type: "style" },
    { id: 4, title: "Pick Your Colors", type: "color" },
    { id: 5, title: "Additional Information (Optional)", type: "textarea" },
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
    { name: "solo", icon: "/solo.svg" },
    { name: "side", icon: "/side.svg" },
    { name: "stack", icon: "/stack.svg" },
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

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setShowResult(true)
    }, 2000)
  }

  const handleSignUp = () => {
    localStorage.setItem('pendingLogoData', JSON.stringify(formData))
    router.push('/auth/signup?redirect_url=/dashboard')
  }

  const QuestionContent = ({ question }: { question: Question }) => {
    switch (question.type) {
      case "input":
        return (
          <Input
            placeholder="Enter your company name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="text-lg p-6 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
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
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">Primary Color</label>
              <div className="grid grid-cols-4 gap-2">
                {["blue", "red", "green", "purple"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, primaryColor: color })}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 capitalize ${
                      formData.primaryColor === color
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-gray-700 hover:border-blue-500/50"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">Background Color</label>
              <div className="grid grid-cols-4 gap-2">
                {["white", "black", "transparent"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, backgroundColor: color })}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 capitalize ${
                      formData.backgroundColor === color
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-gray-700 hover:border-blue-500/50"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      case "textarea":
        return (
          <Textarea
            placeholder="Enter any additional information or requirements..."
            value={formData.additionalInfo}
            onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
            className="min-h-[150px] bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
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
            src="/placeholder.svg"
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
          <Button 
            size="lg" 
            onClick={handleSignUp}
            className="font-semibold bg-blue-600 hover:bg-blue-700"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download Logo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait" custom={direction}>
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
            <div className="mb-8">
              <QuestionContent question={questions[currentQuestion]} />
            </div>
          </motion.div>
        </AnimatePresence>
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
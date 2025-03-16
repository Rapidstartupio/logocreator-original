"use client";

import Spinner from "@/app/components/Spinner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { motion } from "framer-motion";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { SignInButton, useUser } from "@clerk/nextjs";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { domain } from "@/app/lib/domain";
import InfoTooltip from "@/app/components/InfoToolTip";
import { NumberSelector } from "@/app/components/NumberSelector";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import BootcampPopup from "@/app/components/BootcampPopup";

const layouts = [
  { name: "Icon Only", icon: "/solo.svg" },
  { name: "Horizontal", icon: "/side.svg" },
  { name: "Stacked", icon: "/stack.svg" },
];

const logoStyles = [
  { name: "Tech", icon: "/tech.svg" },
  { name: "Flashy", icon: "/flashy.svg" },
  { name: "Modern", icon: "/modern.svg" },
  { name: "Playful", icon: "/playful.svg" },
  { name: "Abstract", icon: "/abstract.svg" },
  { name: "Minimal", icon: "/minimal.svg" },
];

const primaryColors = [
  { name: "Blue", color: "#0F6FFF" },
  { name: "Red", color: "#FF0000" },
  { name: "Green", color: "#00FF00" },
  { name: "Yellow", color: "#FFFF00" },
];

const backgroundColors = [
  { name: "White", color: "#FFFFFF" },
  { name: "Gray", color: "#CCCCCC" },
  { name: "Black", color: "#000000" },
];

// Add this CSS class to handle the grid layout for multiple images
const gridContainerClass = {
  "1": "",
  "3": "grid grid-cols-1 gap-4",
  "6": "grid grid-cols-2 gap-4"
};

// Add this CSS class for the frame styling
const frameClass = (isSelected: boolean) => cn(
  "aspect-square w-full rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden",
  isSelected 
    ? "border-primary ring-2 ring-primary" 
    : "border-dashed border-gray-600 hover:border-gray-400"
);

// Add this helper function to determine what to show in empty frames
const EmptyFrame = ({ isNewFrame }: { isNewFrame: boolean }) => (
  <div className="flex h-full items-center justify-center bg-[#2C2C2C] p-4 text-center">
    <span className="text-sm text-gray-400">
      {isNewFrame 
        ? "Use Generate Logo to get more images" 
        : "Frame will be generated"}
    </span>
  </div>
);

export default function Page() {
  const [companyName, setCompanyName] = useState("");
  const [selectedLayout, setSelectedLayout] = useState(layouts[0].name);
  const [selectedStyle, setSelectedStyle] = useState(logoStyles[0].name);
  const [selectedPrimaryColor, setSelectedPrimaryColor] = useState(
    primaryColors[0].name,
  );
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState(
    backgroundColors[0].name,
  );
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState("1");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [demoAttemptsLeft, setDemoAttemptsLeft] = useState(5);
  const [hasTransferredDemos, setHasTransferredDemos] = useState(false);

  const { isSignedIn, isLoaded, user } = useUser();
  const mutation = useMutation(api.logoHistory.save);
  const transferDemoLogos = useMutation(api.auth.transferDemoLogos);
  
  // Function to format image source correctly
  const formatImageSrc = (imageData: string): string => {
    if (!imageData) return "/placeholder.svg";
    
    // If it's already a data URL, return as is
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    
    // If it's a URL (e.g. from Clerk), return as is
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      return imageData;
    }
    
    // If it's a base64 string (from Together AI or demo API), add the data URL prefix
    if (imageData.length > 100) { // Basic check to see if it's a substantial base64 string
      return `data:image/png;base64,${imageData}`;
    }
    
    // Default to placeholder if we can't determine the format
    return "/placeholder.svg";
  };

  useEffect(() => {
    // Initialize demo attempts if not already set
    const attempts = localStorage.getItem('demoAttempts');
    if (attempts === null) {
      localStorage.setItem('demoAttempts', '5');
      setDemoAttemptsLeft(5);
    } else {
      setDemoAttemptsLeft(parseInt(attempts));
    }

    // Check if user has generated logos before
    const hasGeneratedBefore = localStorage.getItem('hasGeneratedLogo');
    if (hasGeneratedBefore) {
      setIsFirstGeneration(false);
    }
    
    // Check for pending logo data from history selection
    const pendingLogoData = localStorage.getItem('pendingLogoData');
    if (pendingLogoData) {
      try {
        const data = JSON.parse(pendingLogoData);
        
        // Set form data
        setCompanyName(data.companyName || "");
        setSelectedLayout(data.layout || layouts[0].name);
        setSelectedStyle(data.style || logoStyles[0].name);
        setSelectedPrimaryColor(data.primaryColor || primaryColors[0].name);
        setSelectedBackgroundColor(data.backgroundColor || backgroundColors[0].name);
        setAdditionalInfo(data.additionalInfo || "");
        
        // Format and set images
        if (data.generatedImages && Array.isArray(data.generatedImages)) {
          // Process images to ensure they're properly formatted
          const formattedImages = data.generatedImages.map((img: string) => {
            // If the image already has the data:image prefix, extract just the base64 part
            if (img.startsWith('data:image')) {
              const base64Data = img.split(',')[1];
              return base64Data || img;
            }
            return img;
          });
          
          setGeneratedImages(formattedImages);
          setNumberOfImages(formattedImages.length.toString());
          setSelectedImageIndex(0);
        }
        
        // Clear the pending data
        localStorage.removeItem('pendingLogoData');
      } catch (error) {
        console.error('Error loading logo data from history:', error);
        localStorage.removeItem('pendingLogoData');
      }
    }

    // Add effect to handle demo logo transfer
    const handleDemoTransfer = async () => {
      if (isSignedIn && user && !hasTransferredDemos) {
        try {
          await transferDemoLogos({
            userId: user.id,
            email: user.primaryEmailAddress?.emailAddress || "",
          });
          setHasTransferredDemos(true);
          localStorage.removeItem('demoAttempts'); // Clear demo attempts after transfer
        } catch (error) {
          console.error('Error transferring demo logos:', error);
        }
      }
    };

    handleDemoTransfer();
  }, [isSignedIn, user, hasTransferredDemos, transferDemoLogos]);

  // Update the generateSingleLogo function to handle single image refresh
  async function generateSingleLogo(frameIndex: number) {
    if (!isSignedIn) {
      toast({
        variant: "destructive",
        title: "Not Signed In",
        description: "Please sign in to generate logos.",
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAPIKey: localStorage.getItem("userAPIKey") || undefined,
          companyName,
          selectedLayout,
          selectedStyle,
          selectedPrimaryColor,
          selectedBackgroundColor,
          additionalInfo,
          numberOfImages: 1,
        }),
      });

      if (res.ok) {
        const { images } = await res.json();
        if (images && images.length > 0) {
          // Update the UI with the new image
          setGeneratedImages(prev => {
            const updated = [...prev];
            updated[frameIndex] = images[0]; // Store raw base64
            return updated;
          });

          // Save to Convex with raw image data
          await mutation({
            companyName,
            layout: selectedLayout,
            style: selectedStyle,
            primaryColor: selectedPrimaryColor,
            backgroundColor: selectedBackgroundColor,
            additionalInfo: additionalInfo || undefined,
            images: [images[0]], // Pass raw base64
            businessType: additionalInfo || undefined,
            prompt: `${companyName} logo in ${selectedStyle} style with ${selectedLayout} layout`,
            styleDetails: undefined,
            layoutDetails: undefined,
            numberOfImages: 1,
            isDemo: false,
            generationTime: Date.now() - startTime,
            modelUsed: "dall-e-3",
            status: "success"
          });
        }
        // Reload user data to update credits display
        await user?.reload();
      } else {
        const errorData = await res.json().catch(() => null);
        if (res.status === 402) {
          toast({
            variant: "destructive",
            title: "Insufficient Credits",
            description: "Please purchase more credits to continue generating logos.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorData?.error || "Failed to generate logo",
          });
        }
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to the server",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Update the main generateLogo function
  async function generateLogo() {
    // Check if user is signed in or has demo attempts left
    if (!isSignedIn && demoAttemptsLeft <= 0) {
      toast({
        variant: "destructive",
        title: "No Demo Attempts Left",
        description: "Please sign in to continue generating logos.",
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Use demo API if not signed in
      const endpoint = isSignedIn ? "/api/generate-logo" : "/api/demo/generate-logo";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAPIKey: localStorage.getItem("userAPIKey") || undefined,
          companyName,
          selectedLayout,
          selectedStyle,
          selectedPrimaryColor,
          selectedBackgroundColor,
          additionalInfo,
          numberOfImages: parseInt(numberOfImages),
        }),
      });

      if (res.ok) {
        const { images } = await res.json();
        if (images && images.length > 0) {
          // Store raw base64 strings
          setGeneratedImages(images);
          setSelectedImageIndex(0);

          // Save to Convex with raw base64 data
          await mutation({
            companyName,
            layout: selectedLayout,
            style: selectedStyle,
            primaryColor: selectedPrimaryColor,
            backgroundColor: selectedBackgroundColor,
            additionalInfo: additionalInfo || undefined,
            images, // Pass raw base64
            businessType: additionalInfo || undefined,
            prompt: `${companyName} logo in ${selectedStyle} style with ${selectedLayout} layout`,
            styleDetails: undefined,
            layoutDetails: undefined,
            numberOfImages: parseInt(numberOfImages),
            isDemo: !isSignedIn,
            generationTime: Date.now() - startTime,
            modelUsed: "dall-e-3",
            status: "success"
          });

          // Update demo attempts if not signed in
          if (!isSignedIn) {
            const newAttempts = demoAttemptsLeft - 1;
            setDemoAttemptsLeft(newAttempts);
            localStorage.setItem('demoAttempts', newAttempts.toString());
            
            if (newAttempts <= 2) {
              toast({
                title: "Demo Attempts Remaining",
                description: `You have ${newAttempts} demo attempts left. Sign in to continue generating logos.`,
              });
            }
          }

          // Mark as not first generation
          if (isFirstGeneration) {
            setIsFirstGeneration(false);
            localStorage.setItem('hasGeneratedLogo', 'true');
          }
        }
        // Reload user data to update credits display
        await user?.reload();
      } else {
        const errorData = await res.json().catch(() => null);
        if (res.status === 402) {
          toast({
            variant: "destructive",
            title: "Insufficient Credits",
            description: "Please purchase more credits to continue generating logos.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorData?.error || "Failed to generate logo",
          });
        }
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to the server",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#343434] md:flex-row">
      <Header className="block md:hidden" />

      <div className="flex w-full flex-col md:flex-row">
        <div className="relative flex h-[calc(100vh-64px)] w-full flex-col bg-[#2C2C2C] text-[#F3F3F3] md:h-screen md:max-w-sm md:overflow-y-auto">
          <form
            className="flex h-full w-full flex-col"
            onSubmit={(e: React.FormEvent) => e.preventDefault()}
          >
            <fieldset className="flex grow flex-col" disabled={!isSignedIn}>
              <div className="flex-grow overflow-y-auto">
                <div className="px-8 pb-0 pt-4 md:px-6 md:pt-6">
                  {/* Company Name Section */}
                  <div className="mb-6">
                    <label
                      htmlFor="company-name"
                      className="mb-2 block text-xs font-bold uppercase text-[#6F6F6F]"
                    >
                      Company Name
                    </label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Sam's Burgers"
                      required
                    />
                  </div>

                  {/* Number selector */}
                  <div className="mb-6">
                    <NumberSelector 
                      value={numberOfImages} 
                      onValueChange={setNumberOfImages} 
                    />
                  </div>

                  {/* Layout Section */}
                  <div className="mb-6">
                    <label className="mb-2 flex items-center text-xs font-bold uppercase text-[#6F6F6F]">
                      Layout
                      <InfoTooltip content="Select a layout for your logo" />
                    </label>
                    <RadioGroup.Root
                      value={selectedLayout}
                      onValueChange={setSelectedLayout}
                      className="group/root grid grid-cols-3 gap-3"
                    >
                      {layouts.map((layout) => (
                        <RadioGroup.Item
                          value={layout.name}
                          key={layout.name}
                          className="group text-[#6F6F6F] focus-visible:outline-none data-[state=checked]:text-white"
                        >
                          <Image
                            src={layout.icon}
                            alt={layout.name}
                            width={96}
                            height={96}
                            className="w-full rounded-md border border-transparent group-focus-visible:outline group-focus-visible:outline-offset-2 group-focus-visible:outline-gray-400 group-data-[state=checked]:border-white"
                          />
                          <span className="text-xs">{layout.name}</span>
                        </RadioGroup.Item>
                      ))}
                    </RadioGroup.Root>
                  </div>
                  {/* Logo Style Section */}
                  <div className="mb-6">
                    <label className="mb-2 flex items-center text-xs font-bold uppercase text-[#6F6F6F]">
                      STYLE
                      <InfoTooltip content="Choose a style for your logo" />
                    </label>
                    <RadioGroup.Root
                      value={selectedStyle}
                      onValueChange={setSelectedStyle}
                      className="grid grid-cols-3 gap-3"
                    >
                      {logoStyles.map((logoStyle) => (
                        <RadioGroup.Item
                          value={logoStyle.name}
                          key={logoStyle.name}
                          className="group text-[#6F6F6F] focus-visible:outline-none data-[state=checked]:text-white"
                        >
                          <Image
                            src={logoStyle.icon}
                            alt={logoStyle.name}
                            width={96}
                            height={96}
                            className="w-full rounded-md border border-transparent group-focus-visible:outline group-focus-visible:outline-offset-2 group-focus-visible:outline-gray-400 group-data-[state=checked]:border-white"
                          />
                          <span className="text-xs">{logoStyle.name}</span>
                        </RadioGroup.Item>
                      ))}
                    </RadioGroup.Root>
                  </div>
                  {/* Color Picker Section */}
                  <div className="mb-[25px] flex flex-col md:flex-row md:space-x-3">
                    <div className="mb-4 flex-1 md:mb-0">
                      <label className="mb-1 block text-xs font-bold uppercase text-[#6F6F6F]">
                        Primary
                      </label>
                      <Select
                        value={selectedPrimaryColor}
                        onValueChange={setSelectedPrimaryColor}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a fruit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {primaryColors.map((color) => (
                              <SelectItem key={color.color} value={color.name}>
                                <span className="flex items-center">
                                  <span
                                    style={{ backgroundColor: color.color }}
                                    className="mr-2 size-4 rounded-sm bg-white"
                                  />
                                  {color.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block items-center text-xs font-bold uppercase text-[#6F6F6F]">
                        Background
                      </label>
                      <Select
                        value={selectedBackgroundColor}
                        onValueChange={setSelectedBackgroundColor}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a fruit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {backgroundColors.map((color) => (
                              <SelectItem key={color.color} value={color.name}>
                                <span className="flex items-center">
                                  <span
                                    style={{ backgroundColor: color.color }}
                                    className="mr-2 size-4 rounded-sm bg-white"
                                  />
                                  {color.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Additional Options Section */}
                  <div className="mb-1">
                    <div className="mt-1">
                      <div className="mb-1">
                        <label
                          htmlFor="additional-info"
                          className="mb-2 flex items-center text-xs font-bold uppercase text-[#6F6F6F]"
                        >
                          Additional Info
                          <InfoTooltip content="Provide any additional information about your logo" />
                        </label>
                        <Textarea
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          placeholder="Enter additional information"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 py-4 md:px-6 md:py-6">
                <Button
                  size="lg"
                  className="w-full text-base font-bold"
                  type="button"
                  disabled={isLoading || (!isSignedIn && demoAttemptsLeft <= 0)}
                  onClick={async () => {
                    console.log('Button clicked, calling generateLogo');
                    setGeneratedImages([]);
                    await generateLogo();
                  }}
                >
                  {isLoading ? (
                    <div className="loader mr-2" />
                  ) : (
                    <Image
                      src="/generate-icon.svg"
                      alt="Generate Icon"
                      width={16}
                      height={16}
                      className="mr-2"
                    />
                  )}
                  {isLoading ? "Loading..." : (!isSignedIn && demoAttemptsLeft <= 0) ? "Sign in to continue" : "Generate Logo"}{" "}
                </Button>
                {!isSignedIn && demoAttemptsLeft > 0 && (
                  <p className="mt-2 text-center text-sm text-gray-400">
                    {demoAttemptsLeft} demo {demoAttemptsLeft === 1 ? 'attempt' : 'attempts'} remaining
                  </p>
                )}
              </div>
            </fieldset>
          </form>

          {isLoaded && !isSignedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-6"
            >
              <div className="rounded bg-gray-200 p-4 text-gray-900">
                <p className="text-lg">
                  Create a free account to start making logos:
                </p>

                <div className="mt-4">
                  <SignInButton
                    mode="modal"
                    signUpForceRedirectUrl={domain}
                    forceRedirectUrl={domain}
                  >
                    <Button
                      size="lg"
                      className="w-full text-base font-semibold"
                      variant="secondary"
                    >
                      Sign in
                    </Button>
                  </SignInButton>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex w-full flex-col md:min-h-screen">
          <Header className="hidden md:block" />
          <div className="relative flex flex-1 items-center justify-center px-4 py-8">
            <div className="flex w-full max-w-[1200px] justify-center gap-8">
              {/* Grid of smaller images - now centered */}
              {numberOfImages !== "1" && (
                <div className="flex w-64 items-center">
                  <div className={gridContainerClass[numberOfImages as "3" | "6"]}>
                    {Array.from({ length: parseInt(numberOfImages) }).map((_, index) => (
                      <div
                        key={index}
                        onClick={() => generatedImages[index] && setSelectedImageIndex(index)}
                        className={cn(
                          frameClass(index === selectedImageIndex),
                          !generatedImages[index] && "cursor-default"
                        )}
                      >
                        {generatedImages[index] ? (
                          <Image
                            src={formatImageSrc(generatedImages[index])}
                            alt={`Generated logo variation ${index + 1}`}
                            width={256}
                            height={256}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <EmptyFrame isNewFrame={index >= generatedImages.length} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main preview area */}
              <div className="flex items-center justify-center flex-1">
                <div className="relative w-[512px]">
                  {generatedImages.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <div className="relative aspect-square w-full">
                        <Image
                          className={`${isLoading ? "animate-pulse" : ""} rounded-lg`}
                          width={512}
                          height={512}
                          src={formatImageSrc(generatedImages[selectedImageIndex])}
                          alt=""
                          priority
                        />
                        <div
                          className={`pointer-events-none absolute inset-0 transition ${
                            isLoading ? "bg-black/50 duration-500" : "bg-black/0 duration-0"
                          }`}
                        />

                        <div className="absolute -right-12 top-0 flex flex-col gap-2">
                          {isSignedIn ? (
                            <>
                              <Button size="icon" variant="secondary" asChild>
                                <a
                                  href={formatImageSrc(generatedImages[selectedImageIndex])}
                                  download="logo.png"
                                >
                                  <DownloadIcon />
                                </a>
                              </Button>
                              <Button 
                                size="icon" 
                                variant="secondary"
                                onClick={() => generateSingleLogo(selectedImageIndex)}
                                disabled={isLoading}
                              >
                                <Spinner loading={isLoading}>
                                  <RefreshCwIcon />
                                </Spinner>
                              </Button>
                            </>
                          ) : (
                            <>
                              <SignInButton mode="modal">
                                <Button 
                                  size="icon" 
                                  variant="secondary"
                                  onClick={() => {
                                    toast({
                                      title: "Sign in required",
                                      description: "Create a free account to download your logos!",
                                    });
                                  }}
                                >
                                  <DownloadIcon />
                                </Button>
                              </SignInButton>
                              <SignInButton mode="modal">
                                <Button 
                                  size="icon" 
                                  variant="secondary"
                                  onClick={() => {
                                    toast({
                                      title: "Sign in required",
                                      description: "Create a free account to regenerate logos!",
                                    });
                                  }}
                                >
                                  <RefreshCwIcon />
                                </Button>
                              </SignInButton>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Spinner loading={isLoading} className="size-8 text-white">
                      <div className="flex aspect-square w-full flex-col items-center justify-center rounded-xl bg-[#2C2C2C]">
                        <h4 className="text-center text-base leading-tight text-white">
                          Generate your dream<br />logo in 10 seconds!
                        </h4>
                      </div>
                    </Spinner>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
      <BootcampPopup isFirstGeneration={isFirstGeneration} />
    </div>
  );
}
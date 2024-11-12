"use client";

import Spinner from "@/app/components/Spinner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { DownloadIcon, Info, RefreshCwIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/footer";

const layouts = [
  { name: "Solo", icon: "/solo.svg" },
  { name: "Side", icon: "/side.svg" },
  { name: "Stack", icon: "/stack.svg" },
];

const logoStyles = [
  { name: "Flashy", icon: "/flashy.svg" },
  { name: "Tech", icon: "/tech.svg" },
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
  { name: "Gray", color: "#CCCCCC" },
  { name: "Black", color: "#000000" },
  { name: "White", color: "#FFFFFF" },
];

export default function Page() {
  const [userAPIKey, setUserAPIKey] = useState("");
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
  const [generatedImage, setGeneratedImage] = useState("");

  async function generateLogo() {
    setIsLoading(true);

    const res = await fetch("/api/generate-logo", {
      method: "POST",
      body: JSON.stringify({
        userAPIKey,
        companyName,
        selectedLayout,
        selectedStyle,
        selectedPrimaryColor,
        selectedBackgroundColor,
        additionalInfo,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      setGeneratedImage(`data:image/png;base64,${json.b64_json}`);
    } else if (res.headers.get("Content-Type") === "text/plain") {
      toast({
        variant: "destructive",
        title: res.statusText,
        description: await res.text(),
      });
    } else {
      toast({
        variant: "destructive",
        title: "Whoops!",
        description: `There was a problem processing your request: ${res.statusText}`,
      });
    }

    setIsLoading(false);
  }

  return (
    <div className="flex h-screen flex-col overflow-y-auto overflow-x-hidden bg-[#343434] md:flex-row">
      <Header className="block md:hidden" />

      <div className="flex w-full flex-col md:flex-row">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setGeneratedImage("");
            generateLogo();
          }}
          className="flex h-full w-full flex-col bg-[#2C2C2C] text-[#F3F3F3] md:max-w-sm"
        >
          <div className="flex-grow overflow-y-auto">
            <div className="px-8 pb-0 pt-4 md:px-6 md:pt-6">
              {/* API Key Section */}
              <div className="mb-6">
                <label
                  htmlFor="api-key"
                  className="mb-2 block text-xs font-bold uppercase text-[#F3F3F3]"
                >
                  TOGETHER API KEY
                  <span className="ml-2 text-xs uppercase text-[#6F6F6F]">
                    [OPTIONAL]
                  </span>
                </label>

                <Input
                  value={userAPIKey}
                  onChange={(e) => setUserAPIKey(e.target.value)}
                  placeholder="API Key"
                />
              </div>
              {/* Divider Line */}
              <div className="-mx-6 mb-6 h-px w-[calc(100%+48px)] bg-[#343434]"></div>
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
                  placeholder="Amazon"
                  required
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
                  className="grid grid-cols-3 gap-3"
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
                  {/* Additional Info Section */}
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
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? ( // Conditional rendering for loading state
                <div className="loader mr-2"></div> // Spinner element
              ) : (
                <Image
                  src="/generate-icon.svg"
                  alt="Generate Icon"
                  width={16}
                  height={16}
                  className="mr-2"
                />
              )}
              {isLoading ? "Loading..." : "Generate Logo"}{" "}
            </Button>
            {/* <div className="text-center mt-1 text-xs text-[#F3F3F3]">
            Credits: 3
          </div> */}
          </div>
        </form>

        <div className="flex w-full flex-col pt-12 md:pt-0">
          <Header className="hidden md:block" />{" "}
          {/* Show header on larger screens */}
          <div className="relative flex flex-grow items-center justify-center px-4">
            <div className="relative aspect-square w-full max-w-lg">
              {generatedImage ? (
                <>
                  <Image
                    className={`${isLoading ? "animate-pulse" : ""}`}
                    width={512}
                    height={512}
                    src={generatedImage}
                    alt=""
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 transition ${isLoading ? "bg-black/50 duration-500" : "bg-black/0 duration-0"}`}
                  />

                  <div className="absolute -right-12 top-0 flex flex-col gap-2">
                    <Button size="icon" variant="secondary" asChild>
                      <a href={generatedImage} download="logo.png">
                        <DownloadIcon />
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      onClick={generateLogo}
                      variant="secondary"
                    >
                      <Spinner loading={isLoading}>
                        <RefreshCwIcon />
                      </Spinner>
                    </Button>
                  </div>
                </>
              ) : (
                <Spinner loading={isLoading} className="size-8 text-white">
                  <div className="flex aspect-square w-full flex-col items-center justify-center rounded-xl bg-[#2C2C2C]">
                    <h4 className="text-center text-base leading-tight text-white">
                      Generate your dream
                      <br />
                      logo in 10 seconds!
                    </h4>
                  </div>
                </Spinner>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info size={11} className="ml-2 cursor-default text-[#6F6F6F]" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

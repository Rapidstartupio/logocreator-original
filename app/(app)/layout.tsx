import type { Metadata } from "next";
import { Jura } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/app/components/ui/toaster";
import PlausibleProvider from "next-plausible";

const jura = Jura({
  subsets: ["latin"],
  variable: "--font-jura",
});

const title = "Logo-creator.io – Generate a logo";
const description = "Generate a logo for your company";
const url = "https://www.logo-creator.io/";
const ogimage = "https://www.logo-creator.io/og-image.png";
const sitename = "logo-creator.io";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PlausibleProvider domain="logox.ai.io" />
      <div className={`${jura.variable} dark min-h-full bg-[#343434] font-jura antialiased`}>
        {children}
        <Toaster />
      </div>
    </>
  );
}
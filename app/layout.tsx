import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <Providers>
        <html lang="en" className="h-full dark">
          <head>
            <meta name="color-scheme" content="dark" />
            <link rel="icon" href="/favicon.ico" sizes="any" />
            {/* Google tag (gtag.js) */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=AW-11180640635"></script>
            <script 
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'AW-11180640635');
                `
              }}
            />
          </head>
          <body>{children}</body>
        </html>
      </Providers>
    </ClerkProvider>
  );
}

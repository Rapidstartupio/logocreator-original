import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import Script from 'next/script';
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
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=AW-11180640635"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-11180640635');
              `}
            </Script>
            {/* Hotjar Tracking Code for LogoX */}
            <Script id="hotjar" strategy="afterInteractive">
              {`
                (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:5334973,hjsv:6};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
                })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
              `}
            </Script>
          </head>
          <body>{children}</body>
        </html>
      </Providers>
    </ClerkProvider>
  );
}

import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/general/ThemeProvider"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"
import { useDynamicMetadata } from "@/lib/seo/useDynamicMetadata"
import Script from "next/script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})



export function generateMetadata({ searchParams }: { searchParams?: Record<string, string> }) {
  return useDynamicMetadata({
    title: "Browse Jobs in Berlin",
    searchParams,
  })
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://avatar.vercel.sh" />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense>{children}</Suspense>
          <Toaster closeButton richColors />
          <Analytics />
          {/* <SpeedInsights /> */}
        </Providers>
      </body>
    </html>
  )
}

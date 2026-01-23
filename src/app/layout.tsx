import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers"
import { SentryProvider } from "@/components/sentry-provider"
import { Toaster } from "@/components/ui/sonner"
import packageJson from "../../package.json"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://netcalc.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NetCalc - Universal Gross to Net Salary Calculator",
    template: "%s | NetCalc",
  },
  description:
    "Free, open-source salary calculator for 15+ countries. Calculate after-tax income, compare countries side-by-side, and understand tax breakdowns with our transparent, community-driven tool. Perfect for expats, digital nomads, and anyone comparing salaries across borders.",
  keywords: [
    "salary calculator",
    "net salary calculator",
    "gross to net",
    "tax calculator",
    "after-tax income",
    "salary comparison",
    "expat salary",
    "digital nomad",
    "international salary",
    "tax breakdown",
    "effective tax rate",
    "marginal tax rate",
    "Netherlands 30% ruling",
    "Switzerland tax calculator",
    "Germany salary calculator",
    "USA salary calculator",
    "UK salary calculator",
    "Italy impatriate regime",
    "cross-border salary",
    "relocation salary",
  ],
  authors: [{ name: "NetCalc Community" }],
  creator: "NetCalc",
  publisher: "NetCalc",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "NetCalc - Universal Salary Calculator",
    description:
      "Calculate and compare after-tax salaries across 15+ countries. Free, transparent, open-source.",
    siteName: "NetCalc",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "NetCalc - Universal Salary Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NetCalc - Universal Salary Calculator",
    description:
      "Calculate and compare after-tax salaries across 15+ countries. Free, transparent, open-source.",
    images: [`${siteUrl}/og-image.png`],
    creator: "@netcalc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "finance",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "NetCalc",
    "alternateName": "Universal Salary Calculator",
    "description": "Free open-source salary calculator for 15+ countries. Calculate after-tax income, compare countries side-by-side, and understand tax breakdowns.",
    "url": siteUrl,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "featureList": [
      "Calculate net salary after taxes",
      "Compare up to 4 countries side-by-side",
      "Detailed tax breakdown",
      "Effective and marginal tax rates",
      "Currency conversion",
      "Shareable URLs",
      "Support for 15+ countries",
      "Tax variants (30% ruling, impatriate regime, etc.)",
    ],
    "author": {
      "@type": "Organization",
      "name": "NetCalc Community",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1",
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="version" content={`v${packageJson.version}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SentryProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </QueryProvider>
        </SentryProvider>
      </body>
    </html>
  )
}

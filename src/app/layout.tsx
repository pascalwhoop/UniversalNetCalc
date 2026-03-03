import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers"
import { AuthProvider } from "@/components/auth-provider"
import { SentryProvider } from "@/components/sentry-provider"
import { Toaster } from "@/components/ui/sonner"
import { FeedbackPopup } from "@/components/calculator/feedback-popup"
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://decidere.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Decidere — Decide Where to Live",
    template: "%s | Decidere",
  },
  description:
    "Starting with tax-advisor-level salary comparisons across 25+ countries. Decidere helps you decide where to live — financial clarity is just the beginning. Free, open-source, community-driven.",
  keywords: [
    "decidere",
    "relocation decision",
    "where to live",
    "salary comparison",
    "after-tax income",
    "tax calculator",
    "expat",
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
  ],
  authors: [{ name: "Decidere" }],
  creator: "Decidere",
  publisher: "Decidere",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Decidere — Decide Where to Live",
    description:
      "Compare real after-tax income across 25+ countries. Starting with financial clarity — more dimensions coming soon. Free and open-source.",
    siteName: "Decidere",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decidere — Decide Where to Live",
    description:
      "Compare real after-tax income across 25+ countries. Starting with financial clarity — more dimensions coming soon. Free and open-source.",
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
    "name": "Decidere",
    "alternateName": "Decide Where to Live",
    "description": "Compare real after-tax income across 25+ countries. Decidere helps you decide where to live, starting with financial clarity.",
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
      "Compare up to 8 countries side-by-side",
      "Detailed tax breakdown",
      "Effective and marginal tax rates",
      "Currency conversion",
      "Shareable URLs",
      "Support for 25+ countries",
      "Tax variants (30% ruling, impatriate regime, etc.)",
    ],
    "author": {
      "@type": "Organization",
      "name": "Decidere",
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
          <AuthProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <FeedbackPopup />
                <Toaster />
              </ThemeProvider>
            </QueryProvider>
          </AuthProvider>
        </SentryProvider>
      </body>
    </html>
  )
}

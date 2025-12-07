import type React from "react"
import type { Metadata, Viewport } from "next"
import { Mona_Sans, VT323 } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ScrollToTop } from "@/components/scroll-to-top"
import { AuthProvider } from "@/components/auth-provider"
import { AnalyticsProvider } from "@/components/analytics-provider"
import { KatexProvider } from "@/components/katex-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { TopLoader } from "@/components/top-loader"
import { ErrorBoundary } from "@/components/error-boundary"
import { MobileViewportFix } from "@/components/mobile-viewport-fix"
import { RealVHProvider } from "@/components/real-vh-provider"
import { GettingStartedCard } from "@/components/getting-started-card"
import { baseMetadata } from "@/lib/metadata"
import { organizationStructuredData, websiteStructuredData } from "@/lib/structured-data"
import "./globals.css"

const monaSans = Mona_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-mona-sans"
})

const vt323 = VT323({ 
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-vt323"
})

export const metadata: Metadata = {
  ...baseMetadata,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    // Adaugă aceste pentru Google favicon
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1b3a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
      </head>
      <body className={`${monaSans.className} ${monaSans.variable} ${vt323.variable}`}>
        <ErrorBoundary>
          <RealVHProvider />
          <MobileViewportFix />
          <ScrollToTop />
          <TopLoader />
          <AuthProvider>
            <AnalyticsProvider>
              <KatexProvider>
                {children}
              </KatexProvider>
              <Toaster />
              <CookieConsentBanner />
              <GettingStartedCard />
              <div
                className="pointer-events-none fixed bottom-2 left-2 hidden text-[10px] font-medium text-muted-foreground md:flex"
                aria-label="Versiunea site-ului"
              >
                v1.00.01
              </div>
            </AnalyticsProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}

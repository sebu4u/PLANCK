import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Poppins } from "next/font/google"
import { ScrollToTop } from "@/components/scroll-to-top"
import { AuthProvider } from "@/components/auth-provider"
import { AnalyticsProvider } from "@/components/analytics-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { baseMetadata } from "@/lib/metadata"
import { organizationStructuredData, websiteStructuredData } from "@/lib/structured-data"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins"
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
      <body className={`${inter.className} ${poppins.variable}`}>
        <ScrollToTop />
        <AuthProvider>
          <AnalyticsProvider>
            {children}
            <Toaster />
            <CookieConsentBanner />
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

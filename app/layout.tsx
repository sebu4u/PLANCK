import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ScrollToTop } from "@/components/scroll-to-top"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PLANCK - Platforma Educațională de Fizică",
  description:
    "Învață fizica prin cursuri video interactive și probleme captivante. Cursuri pentru clasa a 9-a și a 10-a.",
  keywords: "fizică, educație, liceu, cursuri video, probleme fizică, mecanică, optică, termodinamică, electricitate",
    generator: 'v0.dev'
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
      <body className={inter.className}>
        <ScrollToTop />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

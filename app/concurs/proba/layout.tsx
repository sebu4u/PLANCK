import type { Metadata } from "next"
import type { ReactNode } from "react"
import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Probă concurs fizică"),
  description: "Rezolvă proba Concursului Național de Fizică PLANCK.",
  robots: { index: false, follow: false },
}

export default function ConcursProbaLayout({ children }: { children: ReactNode }) {
  return children
}

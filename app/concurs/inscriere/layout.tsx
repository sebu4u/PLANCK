import type { Metadata } from "next"
import type { ReactNode } from "react"
import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Înscriere concurs fizică"),
  description: "Înscrie-te la Concursul Național de Fizică PLANCK, ediția 2026.",
}

export default function ConcursInscriereLayout({ children }: { children: ReactNode }) {
  return children
}

import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('problems')

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

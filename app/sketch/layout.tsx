import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('sketch')

export default function SketchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}















































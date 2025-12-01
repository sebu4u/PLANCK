import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('pricing')

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}


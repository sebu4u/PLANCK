import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('register')

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

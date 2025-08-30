import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('login')

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

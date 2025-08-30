import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('profile')

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

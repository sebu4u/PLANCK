import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('problems')

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#ffffff]" />
      <div className="relative min-h-screen bg-[#ffffff]">{children}</div>
    </>
  )
}

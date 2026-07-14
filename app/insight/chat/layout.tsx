import type { Metadata } from "next"
import type { ReactNode } from "react"
import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Insight chat"),
  robots: { index: false, follow: false },
}

export default function InsightChatLayout({ children }: { children: ReactNode }) {
  return children
}

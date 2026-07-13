import type { ReactNode } from "react"
import { BlogPageBackground } from "@/components/blog/blog-page-background"

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BlogPageBackground />
      {children}
    </>
  )
}

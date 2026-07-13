"use client"

import { useEffect } from "react"

const BLOG_BACKGROUND = "#ffffff"

export function BlogPageBackground() {
  useEffect(() => {
    const html = document.documentElement
    const { body } = document

    html.style.backgroundColor = BLOG_BACKGROUND
    body.style.backgroundColor = BLOG_BACKGROUND

    const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    const previousThemeColor = themeMeta?.content ?? null

    if (themeMeta) {
      themeMeta.content = BLOG_BACKGROUND
    }

    return () => {
      html.style.removeProperty("background-color")
      body.style.removeProperty("background-color")

      if (themeMeta && previousThemeColor) {
        themeMeta.content = previousThemeColor
      }
    }
  }, [])

  return null
}

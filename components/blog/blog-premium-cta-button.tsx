"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const PREMIUM_CTA_STYLE = {
  "--premium-accent-dark": "#9a5aa8",
  "--start-glow-tint": "rgba(248, 220, 228, 0.88)",
  backgroundImage: "linear-gradient(to right, #8f91f1, #cd83db, #f2b93d)",
} as CSSProperties

const PREMIUM_CTA_CLASS =
  "dashboard-start-glow inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-[#101117] shadow-[0_4px_0_var(--premium-accent-dark)] transition-[transform,box-shadow,opacity] hover:translate-y-0.5 hover:shadow-[0_2px_0_var(--premium-accent-dark)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--premium-accent-dark)]"

type BlogPremiumCtaButtonProps = {
  label: string
  href?: string
  className?: string
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href)
}

export function BlogPremiumCtaButton({ label, href, className }: BlogPremiumCtaButtonProps) {
  const content = <span className="relative z-[1]">{label}</span>

  if (href) {
    if (isExternalHref(href)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(PREMIUM_CTA_CLASS, className)}
          style={PREMIUM_CTA_STYLE}
        >
          {content}
        </a>
      )
    }

    return (
      <Link href={href} className={cn(PREMIUM_CTA_CLASS, className)} style={PREMIUM_CTA_STYLE}>
        {content}
      </Link>
    )
  }

  return (
    <span className={cn(PREMIUM_CTA_CLASS, "cursor-default opacity-90", className)} style={PREMIUM_CTA_STYLE}>
      {content}
    </span>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { BlogPremiumCtaButton } from "@/components/blog/blog-premium-cta-button"
import { BLOG_INLINE_AD_CARD_CLASS } from "@/components/blog/tiptap/blog-ad-card-types"

export type BlogInlineAdCardProps = {
  title: string
  text: string
  ctaLabel: string
  ctaHref?: string
  className?: string
}

export function BlogInlineAdCard({
  title,
  text,
  ctaLabel,
  ctaHref,
  className,
}: BlogInlineAdCardProps) {
  return (
    <div
      className={cn(BLOG_INLINE_AD_CARD_CLASS, className)}
    >
      <h3 className="text-xl font-bold leading-tight text-gray-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-gray-600">{text}</p>
      <div className="mt-6 flex justify-center">
        <BlogPremiumCtaButton label={ctaLabel} href={ctaHref} />
      </div>
    </div>
  )
}

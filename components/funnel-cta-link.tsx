"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

import { trackFunnelEvent } from "@/lib/funnel-analytics"

type FunnelCtaLinkProps = ComponentProps<typeof Link> & {
  ctaId: string
  placement: string
}

export function FunnelCtaLink({
  ctaId,
  placement,
  href,
  onClick,
  ...props
}: FunnelCtaLinkProps) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        trackFunnelEvent("cta_clicked", {
          cta_id: ctaId,
          placement,
          destination: String(href),
        })
        onClick?.(event)
      }}
      {...props}
    />
  )
}

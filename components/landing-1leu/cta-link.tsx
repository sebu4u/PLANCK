"use client"

import type { ComponentProps } from "react"
import { ArrowRight } from "lucide-react"

import { FunnelCtaLink } from "@/components/funnel-cta-link"
import { useAuth } from "@/components/auth-provider"
import { CAMPAIGN_1LEU_SIGNUP_PATH } from "@/lib/onboarding"
import {
  LANDING_1LEU_SPIN_PATH,
  useLanding1LeuCampaign,
} from "@/lib/landing-1leu"

type Landing1LeuCtaLinkProps = Omit<ComponentProps<typeof FunnelCtaLink>, "href" | "ctaId" | "placement"> & {
  ctaId: string
  placement: string
  short?: boolean
  showArrow?: boolean
}

export function landing1LeuCtaCopy(options: {
  isLive: boolean
  short?: boolean
}) {
  if (options.isLive) {
    return options.short ? "Învârte roata acum" : "Roata e deschisă. Învârte acum."
  }
  return "Îmi creez contul"
}

export function Landing1LeuCtaLink({
  ctaId,
  placement,
  short = false,
  showArrow = false,
  onClick,
  children,
  ...props
}: Landing1LeuCtaLinkProps) {
  const { user } = useAuth()
  const { isLive } = useLanding1LeuCampaign()
  const hasUser = Boolean(user)
  const href = isLive || hasUser ? LANDING_1LEU_SPIN_PATH : CAMPAIGN_1LEU_SIGNUP_PATH
  const label = landing1LeuCtaCopy({ isLive, short })

  return (
    <FunnelCtaLink
      href={href}
      ctaId={ctaId}
      placement={placement}
      onClick={onClick}
      {...props}
    >
      {children ?? label}
      {!children && !isLive ? (
        <span className="ml-2 text-[11px] font-semibold text-white/75">~20s</span>
      ) : null}
      {showArrow ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
    </FunnelCtaLink>
  )
}

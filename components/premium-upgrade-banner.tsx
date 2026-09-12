"use client"

import Image from "next/image"
import { useCallback, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { FreePlanComparisonOverlay } from "@/components/invata/free-plan-comparison-overlay"
import { useOnboardingTrialOfferWindow } from "@/hooks/use-onboarding-trial-offer-window"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { useToast } from "@/hooks/use-toast"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { startPremiumCheckout } from "@/lib/stripe-checkout-client"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

export const PREMIUM_UPGRADE_BANNER_SHELL_CLASS =
  "group flex w-full items-center justify-center gap-2.5 bg-gradient-to-r from-[#eef2ff] via-[#fdf2f8] to-[#fff7ed] px-4 py-2.5 text-center"

export const PREMIUM_UPGRADE_BANNER_TEXT_CLASS =
  "text-sm font-semibold leading-snug text-[#2a2438] sm:text-[15px]"

export function PremiumBannerGradientLink({ children }: { children: ReactNode }) {
  return (
    <span className="bg-[linear-gradient(90deg,#8b5cf6_0%,#e879f9_55%,#f2b93d_100%)] bg-[length:100%_2px] bg-bottom bg-no-repeat pb-[2px]">
      {children}
    </span>
  )
}

interface PremiumUpgradeBannerProps {
  defaultMessage?: ReactNode
  className?: string
  showIcon?: boolean
  compact?: boolean
}

export function PremiumUpgradeBanner({
  defaultMessage,
  className,
  showIcon = true,
  compact = false,
}: PremiumUpgradeBannerProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { isPaid } = useSubscriptionPlan()
  const trialOffer = useOnboardingTrialOfferWindow(user?.created_at)
  const [premiumUpgradeOpen, setPremiumUpgradeOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleOpen = useCallback(() => setPremiumUpgradeOpen(true), [])
  const handleClose = useCallback(() => setPremiumUpgradeOpen(false), [])

  const handleStartTrial = useCallback(async () => {
    if (checkoutLoading) return

    playButtonClickSound()

    try {
      setCheckoutLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken || !user) {
        router.push("/login")
        return
      }

      const result = await startPremiumCheckout({
        accessToken,
        interval: "week",
        onboardingTrial: true,
      })

      if (!result.ok) {
        throw new Error(result.error)
      }

      if ("applied" in result && result.applied) {
        toast({
          title: "Premium activat",
          description: "Abonamentul tău a fost actualizat.",
        })
        router.push("/dashboard")
        return
      }

      if ("url" in result) {
        window.location.assign(result.url)
      }
    } catch (error) {
      toast({
        title: "Eroare la checkout",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setCheckoutLoading(false)
    }
  }, [checkoutLoading, router, toast, user])

  if (isPaid) return null

  const resolvedDefaultMessage =
    defaultMessage ?? (
      <>
        Treci la Premium și accesează Insight fără limite.{" "}
        <PremiumBannerGradientLink>Go Premium</PremiumBannerGradientLink>
      </>
    )

  return (
    <>
      <button
        type="button"
        onClick={trialOffer.active ? () => void handleStartTrial() : handleOpen}
        disabled={trialOffer.active && checkoutLoading}
        className={cn(
          "burger:hidden",
          PREMIUM_UPGRADE_BANNER_SHELL_CLASS,
          compact && "gap-1.5 px-3 py-1.5",
          className,
        )}
      >
        {showIcon ? (
          <span
            className={cn(
              "relative flex-shrink-0",
              compact ? "h-5 w-5" : "h-8 w-8 sm:h-9 sm:w-9",
            )}
          >
            <Image
              src="/streak-icon.png"
              alt=""
              width={compact ? 20 : 36}
              height={compact ? 20 : 36}
              className="h-full w-full object-contain"
            />
          </span>
        ) : null}

        {trialOffer.active ? (
          <span
            className={cn(
              PREMIUM_UPGRADE_BANNER_TEXT_CLASS,
              "inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5",
              compact && "text-[12px] font-semibold leading-none sm:text-[12px]",
            )}
          >
            {compact ? (
              <>
                <span>
                  Premium <span className="font-extrabold tracking-wide">GRATUIT</span> 7 zile ·{" "}
                  {trialOffer.remainingLabel}
                </span>
                <PremiumBannerGradientLink>
                  {checkoutLoading ? "..." : "Începe"}
                </PremiumBannerGradientLink>
              </>
            ) : (
              <>
                <span>
                  Încearcă Premium{" "}
                  <span className="font-extrabold tracking-wide">GRATUIT</span> 7 zile.
                  Oferta expiră în {trialOffer.remainingLabel}.
                </span>
                <PremiumBannerGradientLink>
                  {checkoutLoading ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Se deschide...
                    </span>
                  ) : (
                    "Începe trial-ul"
                  )}
                </PremiumBannerGradientLink>
              </>
            )}
          </span>
        ) : (
          <span
            className={cn(
              PREMIUM_UPGRADE_BANNER_TEXT_CLASS,
              compact && "text-[12px] font-semibold leading-none sm:text-[12px]",
            )}
          >
            {compact ? (
              <>
                Treci la Premium. <PremiumBannerGradientLink>Go Premium</PremiumBannerGradientLink>
              </>
            ) : (
              resolvedDefaultMessage
            )}
          </span>
        )}
      </button>

      {premiumUpgradeOpen ? <FreePlanComparisonOverlay onClose={handleClose} /> : null}
    </>
  )
}

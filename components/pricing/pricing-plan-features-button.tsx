"use client"

import { Check, Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  PRICING_PLAN_FEATURES,
  PRICING_PLAN_FEATURE_TITLES,
  type PricingPlanId,
} from "@/components/pricing/pricing-plan-features"
import { cn } from "@/lib/utils"

type PricingPlanFeaturesButtonProps = {
  planId: PricingPlanId
  className?: string
}

export function PricingPlanFeaturesButton({ planId, className }: PricingPlanFeaturesButtonProps) {
  const features = PRICING_PLAN_FEATURES[planId]
  const title = PRICING_PLAN_FEATURE_TITLES[planId]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            "absolute right-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-gray-600 shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition hover:bg-gray-50 hover:text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 sm:right-3 sm:top-3",
            className,
          )}
          aria-label={`Vezi ce include planul ${planId === "plus" ? "Plus+" : planId === "premium" ? "Premium" : "Free"}`}
        >
          <Info className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="z-[60] w-[min(18.5rem,calc(100vw-1.5rem))] rounded-2xl border border-black/10 bg-white p-3.5 text-[#171717] shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-semibold tracking-[-0.02em]">{title}</p>
        <ul className="mt-2.5 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs leading-snug text-gray-700 sm:text-[13px]">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
              </span>
              <span
                className={cn(
                  planId === "premium" && feature === "Acces la PLANCKPASS" && "font-semibold text-[#171717]",
                )}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

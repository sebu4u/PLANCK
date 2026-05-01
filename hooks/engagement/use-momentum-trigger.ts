"use client"

import { useCallback } from "react"
import { useEngagement } from "@/components/engagement/notification-provider"
import { getMomentumCopy } from "@/lib/engagement/copy"

interface MomentumInput {
  nextHref: string
  isLastItem: boolean
  itemIndex: number
  totalItems: number
}

const MOMENTUM_KEY = "planck_engagement:momentum:item_streak"

export function useMomentumTrigger() {
  const engagement = useEngagement()

  return useCallback(
    ({ nextHref, isLastItem, itemIndex, totalItems }: MomentumInput) => {
      const copy = getMomentumCopy()
      let streak = 1

      try {
        streak = Number(window.sessionStorage.getItem(MOMENTUM_KEY) || "0") + 1
        window.sessionStorage.setItem(MOMENTUM_KEY, String(streak))
      } catch {
        streak = 1
      }

      const shouldShow = isLastItem || streak >= 3
      if (!shouldShow) return

      if (isLastItem) {
        try {
          window.sessionStorage.removeItem(MOMENTUM_KEY)
        } catch {
          // Ignore storage errors.
        }
      }

      engagement.push({
        type: "momentum",
        surface: "toast",
        priority: isLastItem ? 65 : 50,
        dedupeKey: `momentum:${new Date().toISOString().slice(0, 10)}:${nextHref}`,
        payload: {
          ...copy,
          description: isLastItem
            ? "Lecția e gata. Poți transforma finalul ăsta într-un start pentru următoarea."
            : `Ai parcurs ${Math.min(itemIndex, totalItems)} din ${totalItems}. Mai fă un pas cât ești în ritm.`,
          icon: "momentum",
          cta: {
            label: isLastItem ? "Continuă lecțiile" : "Următorul pas",
            href: nextHref,
          },
        },
      })
    },
    [engagement]
  )
}


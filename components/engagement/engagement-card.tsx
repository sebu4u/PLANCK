"use client"

import Link from "next/link"
import { Flame, Lightbulb, PlayCircle, TrendingUp, Users, X, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EngagementNotification } from "@/lib/engagement/types"

const iconByName: Record<NonNullable<EngagementNotification["payload"]["icon"]>, LucideIcon> = {
  progress: TrendingUp,
  streak: Flame,
  social: Users,
  hint: Lightbulb,
  momentum: PlayCircle,
}

interface EngagementCardProps {
  notification: EngagementNotification
  visible: boolean
  onDismiss: () => void
}

export function EngagementCard({ notification, visible, onDismiss }: EngagementCardProps) {
  const { payload } = notification
  const Icon = iconByName[payload.icon ?? "progress"] ?? TrendingUp

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 hidden transition-all duration-700 ease-out md:block ${
        visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-full opacity-0 scale-95"
      }`}
    >
      <div className="max-w-sm rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/75 to-fuchsia-50/75 p-4 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-violet-200 hover:from-violet-50 hover:to-fuchsia-50">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="h-5 w-5 shrink-0 text-violet-600" />
            <h3 className="truncate font-bold text-violet-950">{payload.title}</h3>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-full p-1 text-violet-600 transition-colors hover:bg-white/60 hover:text-violet-900"
            aria-label="Închide notificarea"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {payload.description ? (
          <p className="mb-3 text-sm leading-relaxed text-violet-900/85">{payload.description}</p>
        ) : null}

        {(payload.cta || payload.secondaryCta) && (
          <div className="flex flex-col gap-2">
            {payload.cta ? (
              payload.cta.href ? (
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  <Link href={payload.cta.href} onClick={payload.cta.onClick}>
                    {payload.cta.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={payload.cta.onClick ?? onDismiss}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  {payload.cta.label}
                </Button>
              )
            ) : null}

            {payload.secondaryCta ? (
              payload.secondaryCta.href ? (
                <Link
                  href={payload.secondaryCta.href}
                  onClick={payload.secondaryCta.onClick}
                  className="text-center text-sm font-medium text-violet-700 transition-colors hover:text-violet-900 hover:underline"
                >
                  {payload.secondaryCta.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={payload.secondaryCta.onClick ?? onDismiss}
                  className="text-sm font-medium text-violet-700 transition-colors hover:text-violet-900 hover:underline"
                >
                  {payload.secondaryCta.label}
                </button>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}


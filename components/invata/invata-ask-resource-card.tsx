"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"
import type { PlanckResourceReference } from "@/lib/insight/agent/types"
import { cn } from "@/lib/utils"

function resourceTypeLabel(type: PlanckResourceReference["type"]): string {
  switch (type) {
    case "learning_path":
      return "Traseu de învățare"
    case "lesson":
      return "Lecție"
    case "course":
      return "Curs"
    case "problem":
      return "Problemă"
    case "quiz":
      return "Grilă"
    default:
      return "Resursă Planck"
  }
}

function resourceMetaLine(resource: PlanckResourceReference): string {
  const parts = [
    resourceTypeLabel(resource.type),
    resource.subtitle ?? resource.topic ?? null,
    resource.difficulty ?? null,
  ].filter(Boolean)
  return parts.join(" · ")
}

export function InvataAskResourceCard({
  resource,
  className,
}: {
  resource: PlanckResourceReference
  className?: string
}) {
  const iconUrl =
    typeof resource.metadata?.icon_url === "string" ? resource.metadata.icon_url : null
  const description =
    resource.reason?.trim() ||
    "Resursă existentă din Planck potrivită obiectivului tău de învățare."

  return (
    <Link
      href={resource.url}
      className={cn(
        "flex gap-3 rounded-xl border border-[#ececec] bg-[#fafafa] p-3 transition-colors hover:border-[#dcdcdc] hover:bg-[#f5f5f5]",
        className,
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e6e6e6] bg-white">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <BookOpen className="h-7 w-7 text-[#5f5f5f]" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[#111111]">{resource.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#707070]">{description}</p>
        <p className="mt-2 text-xs text-[#9a9a9a]">{resourceMetaLine(resource)}</p>
      </div>
    </Link>
  )
}

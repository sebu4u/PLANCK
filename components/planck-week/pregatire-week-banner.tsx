"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"

const STORAGE_KEY = "planck-week-pregatire-banner-seen"

export function PlanckWeekPregatireBanner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromWeek = searchParams.get("from") === "planck-week"
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!fromWeek) return
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return
    } catch {
      // ignore
    }
    setVisible(true)
  }, [fromWeek])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete("from")
    const query = params.toString()
    router.replace(query ? `/pregatire?${query}` : "/pregatire", { scroll: false })
  }

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl bg-[#F8F7FF] px-4 py-3.5 ring-1 ring-[#EBE8FF] sm:px-5">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2.5 top-2.5 rounded-full p-1 text-gray-400 hover:bg-white hover:text-gray-700"
        aria-label="Închide"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 text-sm font-bold text-gray-900 sm:text-base">
        Ai loc la Planck Week — iată programul live
      </p>
      <p className="mt-1 pr-8 text-sm leading-relaxed text-gray-500">
        Alege sesiunile la materiile rezervate. Ședințele rămân înregistrate dacă ratezi ora.
      </p>
    </div>
  )
}

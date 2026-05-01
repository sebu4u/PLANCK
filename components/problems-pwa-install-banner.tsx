"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function ProblemsPwaInstallBanner() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [shouldShow, setShouldShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAndroid = userAgent.includes("android")
    const isIos =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
    const standaloneQuery = window.matchMedia("(display-mode: standalone)")
    const mobileQuery = window.matchMedia("(max-width: 947px)")

    const updateVisibility = () => {
      setShouldShow(isAndroid && !isIos && mobileQuery.matches && !standaloneQuery.matches)
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPromptEvent(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstallPromptEvent(null)
      setShouldShow(false)
    }

    updateVisibility()
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    mobileQuery.addEventListener("change", updateVisibility)
    standaloneQuery.addEventListener("change", updateVisibility)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      mobileQuery.removeEventListener("change", updateVisibility)
      standaloneQuery.removeEventListener("change", updateVisibility)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      const returnTo = `${window.location.pathname}${window.location.search}`
      router.push(`/aplicatie-mobila?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }

    try {
      await installPromptEvent.prompt()
      await installPromptEvent.userChoice
    } catch {
      const returnTo = `${window.location.pathname}${window.location.search}`
      router.push(`/aplicatie-mobila?returnTo=${encodeURIComponent(returnTo)}`)
    } finally {
      setInstallPromptEvent(null)
    }
  }

  if (!shouldShow) return null

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className="burger:hidden flex w-full items-center gap-3 border-y border-gray-100 bg-white px-4 py-2.5 text-left shadow-[0_8px_20px_-18px_rgba(15,23,42,0.7)] transition-colors active:bg-gray-50"
      aria-label="Instalează aplicația PLANCK"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f8ed] shadow-[0_2px_10px_rgba(15,23,42,0.14)]">
        <img
          src="/android-chrome-192x192.png"
          alt=""
          className="h-8 w-8 rounded-lg"
          width={32}
          height={32}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold leading-5 text-[#0b0d10]">
          Mai bine în aplicație
        </span>
        <span className="block truncate text-sm font-medium leading-5 text-[#0b0d10]/80">
          Instalează PLANCK pentru acces rapid
        </span>
      </span>
      <span className="shrink-0 rounded-full border border-[#0b0d10]/10 bg-white px-4 py-2 text-sm font-extrabold text-[#0b0d10] shadow-[0_3px_0_rgba(15,23,42,0.14)]">
        Instalează
      </span>
    </button>
  )
}

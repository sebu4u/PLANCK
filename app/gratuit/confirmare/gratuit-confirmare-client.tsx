"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import { ArrowRight, Rocket } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

const dashboardCtaClassName = cn(
  "dashboard-start-glow inline-flex w-full max-w-sm items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#5b21b6] active:translate-y-1 active:shadow-[0_1px_0_#5b21b6]",
)

const dashboardCtaGlowStyle = {
  "--start-glow-tint": "rgba(221, 211, 255, 0.84)",
} as CSSProperties

export function GratuitConfirmareClient() {
  const { user, loading } = useAuth()

  const ctaHref = loading ? null : user ? "/probleme" : "/register"

  return (
    <div className="flex min-h-screen w-full flex-col px-4 py-10 sm:py-16">
      <header className="mx-auto mb-10 flex w-full max-w-lg justify-center">
        <Link
          href="/"
          className="title-font flex items-center gap-2 text-xl font-bold text-black dark:text-white sm:text-2xl"
        >
          <Rocket className="h-6 w-6 shrink-0 text-black dark:text-white" />
          <span>PLANCK</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
        <img
          src="/streak-icon.png"
          alt=""
          width={112}
          height={112}
          className="mx-auto mb-6 h-24 w-24 object-contain sm:mb-8 sm:h-28 sm:w-28"
        />

        <h1 className="mb-4 text-2xl font-bold text-black dark:text-white sm:text-3xl">
          Te-ai înscris cu succes!
        </h1>
        <p className="mb-10 max-w-md text-base text-gray-600 dark:text-gray-400 sm:text-lg">
          O să te contactăm pentru mai multe detalii despre webinar!
        </p>

        {loading ? (
          <div
            className="mx-auto h-12 w-full max-w-sm animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
            aria-hidden
          />
        ) : ctaHref ? (
          <Link
            href={ctaHref}
            className={dashboardCtaClassName}
            style={dashboardCtaGlowStyle}
          >
            <span className="relative z-[1] inline-flex items-center justify-center gap-2">
              Începe acum
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </span>
          </Link>
        ) : null}
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"

export function AiAgentLimitBanner() {
  return (
    <div className="relative mx-4 mb-3">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-1/2 h-28 w-[140%] -translate-x-1/2 rounded-full bg-gradient-radial from-white/20 via-white/10 to-transparent blur-2xl opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 left-1/2 h-20 w-[140%] -translate-x-1/2 opacity-50 animate-[twinkle_4s_ease-in-out_infinite_alternate]"
        style={{
          backgroundImage:
            "radial-gradient(2px 2px at 20% 70%, rgba(255, 255, 255, 0.5), transparent 60%), radial-gradient(1px 1px at 45% 55%, rgba(255, 255, 255, 0.45), transparent 60%), radial-gradient(2px 2px at 70% 65%, rgba(255, 255, 255, 0.35), transparent 60%), radial-gradient(1px 1px at 85% 45%, rgba(255, 255, 255, 0.4), transparent 60%)",
          backgroundRepeat: "repeat",
          backgroundSize: "160px 80px",
        }}
      />
      <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-3 shadow-md animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-gray-200">
            <Sparkles className="mt-0.5 h-4 w-4 text-gray-300" />
            <p className="text-sm text-gray-200">
              Ai atins limita zilnică pentru AI Agent. Problema asta pare grea... vrei să continui?
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:border-white/40 hover:text-white"
          >
            Vezi Pricing
          </Link>
        </div>
      </div>
    </div>
  )
}

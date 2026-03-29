"use client"

import Link from "next/link"
import { ArrowRight, Trophy } from "lucide-react"

export function DashboardRezultateCard() {
  return (
    <Link
      href="/concurs/rezultate"
      prefetch={false}
      className="group mb-4 block md:mb-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-orange-200/90 bg-gradient-to-r from-white via-orange-50/40 to-amber-50/50 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_14px_34px_rgba(234,88,12,0.12)] md:p-5">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-orange-400/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative z-[1] flex items-center gap-3 md:gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-orange-200/80 bg-white/90 text-orange-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:h-12 md:w-12">
            <Trophy className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold tracking-tight text-gray-900 md:text-lg">
              Rezultate Concurs PLANCK
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              Clasament oficial pe clase — deschide pagina de rezultate
            </p>
          </div>

          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-orange-200/80 bg-white/90 text-orange-500 transition-transform duration-300 group-hover:translate-x-0.5 md:h-10 md:w-10">
            <ArrowRight className="h-4 w-4 md:h-[18px] md:w-[18px]" aria-hidden />
          </div>
        </div>
      </div>
    </Link>
  )
}

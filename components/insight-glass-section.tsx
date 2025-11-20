"use client"

import { useMemo, useRef } from "react"

export default function InsightGlassSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const pageBg = useMemo(() => '#0d1117', [])

  // No scroll-driven transforms; card remains static in normal flow

  return (
    <section ref={sectionRef} className="relative z-20 -mt-[60rem] sm:-mt-[64rem] md:-mt-[68rem] lg:-mt-[72rem]">
      <div className="mx-auto w-full px-6 pt-0 pb-24 flex justify-center">
        <div
          ref={cardRef}
          className="w-full max-w-6xl"
        >
          {/* Outer glow */}
          <div className="relative">
            {/* Subtle purple glow layer - larger area, more diffused */}
            <div className="absolute inset-x-0 top-0 h-3/4 -z-20 rounded-t-3xl bg-gradient-to-r from-purple-500/30 to-violet-500/30 blur-3xl scale-125" />
            
            {/* Multiple blue glow layers for uneven, solid effect - only top and sides */}
            <div className="absolute inset-x-0 top-0 h-3/4 -z-10 rounded-t-3xl bg-gradient-to-r from-blue-400/90 to-cyan-400/90 blur-2xl scale-110" />
            <div className="absolute inset-x-0 top-0 h-3/4 -z-10 rounded-t-3xl bg-gradient-to-br from-blue-500/95 via-blue-400/70 to-cyan-500/95 blur-xl scale-105" />
            <div className="absolute inset-x-0 top-0 h-3/4 -z-10 rounded-t-3xl bg-gradient-to-tl from-cyan-400/85 via-blue-500/75 to-blue-600/85 blur-lg scale-102" />

            {/* Solid card: rounded only on the top, transparent sides */}
            <div className="overflow-hidden rounded-t-3xl border border-slate-700/30 bg-slate-800 shadow-2xl">
              {/* Top transparent area (shows orb through) */}
              <div className="h-56 sm:h-64 md:h-72 lg:h-80" />

              {/* Bottom content area with dark gray-blue background */}
              <div className="p-8 md:p-12 lg:p-16 bg-slate-800" style={{ minHeight: '200px' }}>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Section title</h2>
                <p className="text-gray-300 leading-relaxed">
                  A glass-like card with only the top corners rounded. The sides remain transparent so the orb
                  in the background stays visible outside the card width.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



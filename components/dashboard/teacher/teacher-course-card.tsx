"use client"

import { Play } from "lucide-react"

export function TeacherCourseCard() {
  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-3xl border border-[#e5e5e5] bg-[#111827] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(26,115,232,0.85) 0%, rgba(110,78,242,0.75) 45%, rgba(17,24,39,0.95) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.12),transparent_55%)]" aria-hidden />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm">
          <Play className="ml-1 h-7 w-7 fill-white" aria-hidden />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-5 pb-5 pt-16">
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Cum să gestionezi clasa ta cu Planck
        </h2>
        <p className="mt-1 text-sm text-white/75">Tutorial pentru super profesori</p>
      </div>
    </div>
  )
}

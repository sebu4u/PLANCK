"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { FadeInLeft, FadeInRight, FadeInUp } from "@/components/scroll-animations"

const USER_MSG = "Nu înțeleg de ce folosim t = s / v aici."
const ASSISTANT_CHUNKS = [
  "Hai să o luăm pas cu pas — fără să-ți dau răspunsul direct.",
  "Știm distanța și viteza. Ce mărime necunoscută cauți?",
  "Exact: timpul. Pentru mișcare rectilinie uniformă, relația e t = s / v. Înlocuiești valorile și verifici unitățile.",
]

export function LandingInsightSection() {
  const [phase, setPhase] = useState(0)
  const [stream, setStream] = useState("")
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    let cancelled = false
    const run = async () => {
      await wait(600)
      if (cancelled) return
      setPhase(1)
      await wait(800)
      if (cancelled) return
      setPhase(2)

      for (let i = 0; i < ASSISTANT_CHUNKS.length; i++) {
        const chunk = ASSISTANT_CHUNKS[i]
        setStream("")
        for (let c = 0; c <= chunk.length; c++) {
          if (cancelled) return
          setStream(chunk.slice(0, c))
          await wait(14)
        }
        await wait(700)
        if (cancelled) return
        setPhase(3 + i)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const shownAssistant = ASSISTANT_CHUNKS.slice(0, Math.max(0, phase - 2))

  return (
    <section className="overflow-hidden bg-[#F8F7FF] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeInRight>
            <FadeInUp>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBE8FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5B47D6]">
                <Sparkles className="h-3.5 w-3.5" />
                Insight AI
              </span>
            </FadeInUp>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Insight nu-ți dă răspunsul. Te învață cum să ajungi la el.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
              Ghidare socratică, explicații pas cu pas, adaptat la nivelul tău — disponibil în orice lecție sau problemă.
            </p>
            <ul className="mt-8 space-y-3 text-sm font-medium text-gray-700 sm:text-base">
              <li className="flex gap-2">
                <span className="text-[#7C5CFC]">•</span>
                Nu spoilează soluția — te întreabă până prinzi ideea
              </li>
              <li className="flex gap-2">
                <span className="text-[#7C5CFC]">•</span>
                Se adaptează dacă ești la început sau la nivel de olimpiadă
              </li>
              <li className="flex gap-2">
                <span className="text-[#7C5CFC]">•</span>
                Disponibil 24/7, în lecții, grile și probleme
              </li>
            </ul>
          </FadeInRight>

          <FadeInLeft>
            <div className="mx-auto max-w-md rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(124,92,252,0.12)] ring-1 ring-[#EBE8FF] sm:p-6">
              <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#c77bff]">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Insight</p>
                  <p className="text-xs text-gray-400">Tutor AI · fizică</p>
                </div>
              </div>
              <div className="min-h-[220px] space-y-3">
                {phase >= 1 && (
                  <div className="ml-8 rounded-2xl rounded-tr-md bg-[#7C5CFC] px-3.5 py-2.5 text-sm text-white">
                    {USER_MSG}
                  </div>
                )}
                {shownAssistant.map((msg) => (
                  <div
                    key={msg}
                    className="mr-8 rounded-2xl rounded-tl-md bg-[#F8F7FF] px-3.5 py-2.5 text-sm leading-relaxed text-gray-700 ring-1 ring-[#EBE8FF]"
                  >
                    {msg}
                  </div>
                ))}
                {phase >= 2 && phase < 3 + ASSISTANT_CHUNKS.length - 1 && stream && (
                  <div className="mr-8 rounded-2xl rounded-tl-md bg-[#F8F7FF] px-3.5 py-2.5 text-sm leading-relaxed text-gray-700 ring-1 ring-[#EBE8FF]">
                    {stream}
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#7C5CFC]" />
                  </div>
                )}
              </div>
            </div>
          </FadeInLeft>
        </div>
      </div>
    </section>
  )
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

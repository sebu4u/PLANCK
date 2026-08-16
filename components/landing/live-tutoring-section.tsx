"use client"

import Link from "next/link"
import { ArrowRight, Check, Clock, MessageCircle, Users, Video } from "lucide-react"
import { FadeInUp, FadeInLeft, FadeInRight } from "@/components/scroll-animations"

const POINTS = [
  {
    Icon: Users,
    text: "10+ pregătiri live săptămânale — deblocate cu energie pe platformă",
  },
  {
    Icon: Video,
    text: "Înregistrări disponibile oricând, dacă ai ratat sesiunea",
  },
  {
    Icon: Check,
    text: "Teme verificate de profesori, nu doar un check automat",
  },
  {
    Icon: MessageCircle,
    text: "Întrebări directe către profesori — răspuns garantat în 24h",
  },
] as const

export function LandingLiveTutoringSection() {
  return (
    <section className="overflow-hidden bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeInRight>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              AI 24/7 pentru concepte. Om real pentru întrebările grele.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
              Insight te ghidează non-stop. Când te blochezi pe ceva greu, ai profesori reali — live și asincron — nu doar un chatbot.
            </p>
            <ul className="mt-8 space-y-4">
              {POINTS.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]">
                    <Icon className="h-4 w-4 text-[#7C5CFC]" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed text-gray-700 sm:text-base">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/pregatire"
              className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
            >
              Vezi orarul meditațiilor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </FadeInRight>

          <FadeInLeft>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="rounded-[28px] bg-gradient-to-br from-[#f3f0ff] to-[#fff8f0] p-6 shadow-[0_24px_60px_rgba(124,92,252,0.14)] ring-1 ring-[#EBE8FF] sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Pregătire live</p>
                    <p className="text-xs text-gray-400">Exemple din orar</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { subject: "Fizică — Mecanică", time: "Luni 18:00", tag: "BAC" },
                    { subject: "Matematică — Analiză", time: "Marți 17:30", tag: "Clasă" },
                    { subject: "Info — Algoritmi", time: "Joi 19:00", tag: "Olimpiadă" },
                  ].map((item) => (
                    <div
                      key={item.subject}
                      className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-gray-100"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.subject}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#EBE8FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5B47D6]">
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeInLeft>
        </div>
      </div>
    </section>
  )
}

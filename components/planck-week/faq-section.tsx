"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { PLANCK_WEEK_FAQ } from "@/lib/planck-week"

export function PlanckWeekFaqSection() {
  const [openId, setOpenId] = useState<string | null>("gratuit")

  return (
    <section className="bg-[#F8F7FF] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <FadeInUp className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Întrebări frecvente
          </h2>
        </FadeInUp>

        <FadeInUp
          delay={0.08}
          className="divide-y divide-[#EBE8FF] rounded-[24px] bg-white px-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/5 sm:px-8"
        >
          {PLANCK_WEEK_FAQ.map((item) => {
            const open = openId === item.id
            return (
              <div key={item.id} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-base font-semibold text-gray-900 sm:text-lg">
                    {item.question}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F8F7FF] text-gray-500">
                    {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="pt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </FadeInUp>
      </div>
    </section>
  )
}

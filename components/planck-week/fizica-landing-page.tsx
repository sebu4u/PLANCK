"use client"

import { useCallback, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Plus, X } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { Footer } from "@/components/footer"
import { HomePageNavbar } from "@/components/homepage-navbar"
import { LandingHeroTestimonialsRow } from "@/components/landing/hero-review-rows"
import { PlanckWeekCtaButton } from "@/components/planck-week/cta-button"
import { PlanckWeekLeadForm } from "@/components/planck-week/lead-form"
import { PlanckWeekSignupDeadlineBanner } from "@/components/planck-week/signup-deadline-banner"
import { PlanckWeekStickyMobileCta } from "@/components/planck-week/sticky-mobile-cta"
import { trackFunnelEvent } from "@/lib/funnel-analytics"
import {
  PLANCK_WEEK_FIZICA_CTA,
  PLANCK_WEEK_FIZICA_FOR_YOU,
  PLANCK_WEEK_FIZICA_FOR_YOU_FOOTNOTE,
  PLANCK_WEEK_FIZICA_FOR_YOU_TITLE,
  PLANCK_WEEK_FIZICA_MICRO_CHIPS,
  PLANCK_WEEK_FIZICA_OUTCOMES,
  PLANCK_WEEK_FIZICA_OUTCOMES_TITLE,
  PLANCK_WEEK_FIZICA_PROMISE_CARDS,
  PLANCK_WEEK_FIZICA_PROMISE_TITLE,
  PLANCK_WEEK_FIZICA_SEATS,
  PLANCK_WEEK_FIZICA_SUBHEAD,
  PLANCK_WEEK_FIZICA_TEACHER_NOTE,
  PLANCK_WEEK_FIZICA_TEACHER_RESULTS,
  PLANCK_WEEK_FIZICA_TIMELINE,
  PLANCK_WEEK_FIZICA_TIMELINE_TITLE,
  PLANCK_WEEK_FIZICA_WHEN,
} from "@/lib/planck-week-fizica"
import {
  getPlanckWeekLandingTeacher,
  getPlanckWeekSubjectLandingPath,
  PLANCK_WEEK_LANDING_SLUGS,
  PLANCK_WEEK_SUBJECT_LANDINGS,
  type PlanckWeekSubjectLanding,
} from "@/lib/planck-week-subject-landings"
import { WORKSHOP_SUBJECT_LABELS } from "@/lib/pregatire/types"

function Section({
  children,
  tone = "white",
  className = "",
}: {
  children: ReactNode
  tone?: "white" | "mist"
  className?: string
}) {
  return (
    <section
      className={`px-5 py-10 sm:px-6 sm:py-14 lg:py-16 ${
        tone === "mist" ? "bg-[#F7F6FC]" : "bg-white"
      } ${className}`}
    >
      <div className="mx-auto w-full max-w-[34rem]">{children}</div>
    </section>
  )
}

function SectionHeading({
  eyebrow,
  children,
}: {
  eyebrow?: string
  children: ReactNode
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7C5CFC]">{eyebrow}</p>
      ) : null}
      <h2 className={`text-[1.45rem] font-black leading-[1.2] tracking-tight text-gray-900 text-balance sm:text-3xl ${eyebrow ? "mt-2" : ""}`}>
        {children}
      </h2>
    </div>
  )
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(28,25,57,0.05)] ring-1 ring-[#E8E4F8] ${className}`}
    >
      {children}
    </div>
  )
}

export function PlanckWeekFizicaLandingPage({ landing }: { landing: PlanckWeekSubjectLanding }) {
  const [open, setOpen] = useState(false)
  const [faqId, setFaqId] = useState<string | null>(landing.faq[0]?.id ?? null)
  const teacher = getPlanckWeekLandingTeacher(landing)
  const otherLandings = PLANCK_WEEK_LANDING_SLUGS.filter((slug) => slug !== landing.slug)

  const openReserve = useCallback((placement: string) => {
    trackFunnelEvent("cta_clicked", {
      cta_id: "planck_week_subject_reserve",
      placement,
      destination: "lead_form",
      subject: landing.subject,
    })
    setOpen(true)
  }, [landing.subject])

  return (
    <div className="relative min-h-screen bg-white pb-20 sm:pb-0">
      <PlanckWeekSignupDeadlineBanner />
      <section
        id="planck-week-hero"
        className="relative overflow-hidden bg-[linear-gradient(to_bottom,#d9ebff_0%,#eef5ff_22%,#ffffff_48%)]"
      >
        <HomePageNavbar variant="light" />
        <div className="relative z-10 mx-auto w-full max-w-[34rem] px-5 pb-8 pt-[7.75rem] sm:px-6 sm:pb-12 sm:pt-[9.25rem]">
          <FadeInUp>
            <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#5B47D6] ring-1 ring-[#E8E4F8] backdrop-blur-sm">
              {PLANCK_WEEK_FIZICA_WHEN}
            </p>
          </FadeInUp>

          <FadeInUp delay={0.06}>
            <h1 className="mt-4 text-[1.75rem] font-black leading-[1.12] tracking-tight text-gray-900 text-balance min-[400px]:text-[1.95rem] sm:text-[2.5rem] sm:leading-[1.1]">
              Meditație{" "}
              <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
                GRATUITĂ
              </span>{" "}
              de Fizică pentru BAC
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <p className="mt-3.5 text-[15px] leading-7 text-gray-500 sm:text-base sm:leading-8">
              {PLANCK_WEEK_FIZICA_SUBHEAD}
            </p>
          </FadeInUp>

          <FadeInUp delay={0.14} className="mt-5">
            <ul className="flex flex-wrap gap-1.5">
              {PLANCK_WEEK_FIZICA_MICRO_CHIPS.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-gray-600 ring-1 ring-[#E8E4F8]"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </FadeInUp>

          <FadeInUp delay={0.18} className="mt-6">
            <PlanckWeekCtaButton
              onClick={() => openReserve("hero")}
              label={PLANCK_WEEK_FIZICA_CTA}
              className="w-full"
            />
            <p className="mt-2.5 text-center text-[13px] text-gray-500">{PLANCK_WEEK_FIZICA_SEATS}</p>
          </FadeInUp>
        </div>
      </section>

      <LandingHeroTestimonialsRow compact className="border-y border-[#F0EEF8]" />

      <Section>
        <FadeInUp>
          <SectionHeading eyebrow="Cum lucrezi">{PLANCK_WEEK_FIZICA_PROMISE_TITLE}</SectionHeading>
        </FadeInUp>
        <FadeInUp delay={0.08} className="mt-6">
          <Panel>
            <ul className="divide-y divide-[#F0EEF8]">
              {PLANCK_WEEK_FIZICA_PROMISE_CARDS.map((item) => (
                <li key={item.title} className="flex items-start gap-3.5 px-4 py-4 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F6FC] text-lg">
                    {item.emoji}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[15px] font-bold tracking-tight text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-gray-500 sm:text-sm sm:leading-6">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </FadeInUp>
      </Section>

      <Section tone="mist">
        <FadeInUp>
          <SectionHeading eyebrow="Program">{PLANCK_WEEK_FIZICA_TIMELINE_TITLE}</SectionHeading>
        </FadeInUp>
        <FadeInUp delay={0.08} className="mt-6">
          <Panel className="px-4 py-2 sm:px-5">
            <ol>
              {PLANCK_WEEK_FIZICA_TIMELINE.map((item, index) => (
                <li key={item.time} className="relative flex gap-3.5 py-3">
                  {index < PLANCK_WEEK_FIZICA_TIMELINE.length - 1 ? (
                    <span
                      className="absolute bottom-0 left-[15px] top-7 w-px bg-[#E8E4F8]"
                      aria-hidden
                    />
                  ) : null}
                  <span className="relative z-10 mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white ring-[3px] ring-[#E8E4F8]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFC]" />
                  </span>
                  <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                    <p className="text-[15px] font-semibold leading-5 text-gray-900">{item.label}</p>
                    <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[#7C5CFC]">{item.time}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </FadeInUp>
      </Section>

      <Section>
        <FadeInUp>
          <SectionHeading eyebrow="Pentru cine">{PLANCK_WEEK_FIZICA_FOR_YOU_TITLE}</SectionHeading>
        </FadeInUp>
        <FadeInUp delay={0.08} className="mt-6">
          <Panel className="px-4 py-2 sm:px-5">
            <ul>
              {PLANCK_WEEK_FIZICA_FOR_YOU.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b border-[#F0EEF8] py-3.5 last:border-b-0">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C5CFC]" aria-hidden />
                  <span className="text-[15px] leading-6 text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="border-t border-[#F0EEF8] py-4 text-[14px] font-semibold leading-6 text-gray-900">
              {PLANCK_WEEK_FIZICA_FOR_YOU_FOOTNOTE}
            </p>
          </Panel>
        </FadeInUp>
      </Section>

      {teacher ? (
        <Section tone="mist">
          <FadeInUp delay={0.06} className="mt-1">
            <Panel>
              <div className="flex flex-col items-center px-4 pt-6">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-[#F7F6FC] ring-1 ring-black/[0.06] sm:h-28 sm:w-28">
                  {teacher.imageSrc ? (
                    <Image
                      src={teacher.imageSrc}
                      alt={teacher.name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: teacher.imagePosition ?? "center top" }}
                      sizes="112px"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl font-black text-[#7C5CFC]">
                      {teacher.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7C5CFC]">
                  Profesorul tău
                </p>
                <h2 className="mt-1.5 text-[1.35rem] font-black tracking-tight text-gray-900">{teacher.name}</h2>
                <p className="mt-1 text-[13px] text-gray-500">Olimpic național — argint</p>
              </div>
              <ul className="mt-5 border-t border-[#F0EEF8] px-4 py-2 sm:px-5">
                {PLANCK_WEEK_FIZICA_TEACHER_RESULTS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 py-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7C5CFC]" strokeWidth={2.6} />
                    <span className="text-[13px] leading-5 text-gray-600 sm:text-[14px] sm:leading-6">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-[#F0EEF8] px-4 py-4 text-[14px] leading-6 text-gray-600 sm:px-5">
                {PLANCK_WEEK_FIZICA_TEACHER_NOTE}
              </p>
              <div className="px-4 pb-4 sm:px-5">
                <PlanckWeekCtaButton
                  onClick={() => openReserve("teacher")}
                  label={PLANCK_WEEK_FIZICA_CTA}
                  className="w-full"
                />
              </div>
            </Panel>
          </FadeInUp>
        </Section>
      ) : null}

      <Section>
        <FadeInUp>
          <SectionHeading eyebrow="După sesiune">{PLANCK_WEEK_FIZICA_OUTCOMES_TITLE}</SectionHeading>
        </FadeInUp>
        <FadeInUp delay={0.08} className="mt-6">
          <Panel className="px-4 py-2 sm:px-5">
            <ul>
              {PLANCK_WEEK_FIZICA_OUTCOMES.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b border-[#F0EEF8] py-3.5 last:border-b-0">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEF8D8] text-[#3F6B12]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] leading-6 text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </FadeInUp>
      </Section>

      <Section tone="mist">
        <FadeInUp>
          <SectionHeading>Întrebări frecvente</SectionHeading>
        </FadeInUp>
        <FadeInUp delay={0.08} className="mt-6">
          <Panel className="divide-y divide-[#F0EEF8] px-4 sm:px-5">
            {landing.faq.map((item) => {
              const openItem = faqId === item.id
              return (
                <div key={item.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => setFaqId(openItem ? null : item.id)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                    aria-expanded={openItem}
                  >
                    <span className="text-[15px] font-semibold leading-6 text-gray-900 sm:text-base">
                      {item.question}
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7F6FC] text-gray-500">
                      {openItem ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openItem && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-2.5 pr-11 text-[14px] leading-6 text-gray-500">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </Panel>
        </FadeInUp>
      </Section>

      <section className="bg-white px-5 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[34rem] text-center">
          <h2 className="text-[1.45rem] font-black leading-[1.2] tracking-tight text-gray-900 text-balance sm:text-3xl">
            Joi, 10 septembrie, ora 20:00
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-gray-500">
            O sesiune live de fizică pentru BAC. Gratuit, fără card.
          </p>
          <div className="mt-6">
            <PlanckWeekCtaButton
              onClick={() => openReserve("final")}
              label={PLANCK_WEEK_FIZICA_CTA}
              className="w-full"
            />
          </div>
          <p className="mt-2.5 text-[13px] text-gray-500">{PLANCK_WEEK_FIZICA_SEATS}</p>
        </div>
      </section>

      <nav className="border-t border-[#EDEAF8] bg-[#F7F6FC] px-5 py-8" aria-label="Celelalte materii Planck Week">
        <div className="mx-auto flex max-w-[34rem] flex-col gap-3">
          <p className="text-[13px] font-semibold text-gray-500">Sau vezi altă materie</p>
          <div className="flex flex-wrap gap-2">
            {otherLandings.map((slug) => (
              <Link
                key={slug}
                href={getPlanckWeekSubjectLandingPath(slug)}
                className="rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-800 ring-1 ring-[#E8E4F8]"
              >
                {WORKSHOP_SUBJECT_LABELS[PLANCK_WEEK_SUBJECT_LANDINGS[slug].subject]}
              </Link>
            ))}
            <Link href="/planck-week" className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-[#7C5CFC]">
              Toate materiile
            </Link>
          </div>
        </div>
      </nav>

      <Footer theme="light" backgroundColor="bg-[#F7F6FC]" borderColor="border-gray-200" />
      <PlanckWeekStickyMobileCta
        hidden={open}
        onReserve={() => openReserve("sticky")}
        label={PLANCK_WEEK_FIZICA_CTA}
      />
      <PlanckWeekLeadForm open={open} onOpenChange={setOpen} lockSubject="fizica" />
    </div>
  )
}

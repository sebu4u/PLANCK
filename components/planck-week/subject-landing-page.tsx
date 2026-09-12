"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Clock, Plus, X } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { Footer } from "@/components/footer"
import { HomePageNavbar } from "@/components/homepage-navbar"
import { Landing1LeuHeroConfetti } from "@/components/landing-1leu/hero-confetti"
import { extractYouTubeVideoId, LazyYouTubePlayer } from "@/components/lazy-youtube-player"
import { PlanckWeekCtaButton } from "@/components/planck-week/cta-button"
import { PlanckWeekFaqTeacher } from "@/components/planck-week/faq-teacher"
import { PlanckWeekLeadForm } from "@/components/planck-week/lead-form"
import { PlanckWeekSignupDeadlineBanner } from "@/components/planck-week/signup-deadline-banner"
import { PlanckWeekStickyMobileCta } from "@/components/planck-week/sticky-mobile-cta"
import { landingInstagramHandle, landingInstagramHref } from "@/lib/landing-teachers"
import { trackFunnelEvent } from "@/lib/funnel-analytics"
import {
  PLANCK_WEEK_DATES,
  PLANCK_WEEK_MICROCOPY,
  PLANCK_WEEK_MOBILE_CALENDAR_FROM,
  PLANCK_WEEK_MOBILE_CALENDAR_TO,
} from "@/lib/planck-week"
import {
  getPlanckWeekLandingTeacher,
  getPlanckWeekLandingVideoUrl,
  getPlanckWeekSubjectLandingPath,
  PLANCK_WEEK_LANDING_SLUGS,
  PLANCK_WEEK_SUBJECT_LANDINGS,
  type PlanckWeekSubjectLanding,
} from "@/lib/planck-week-subject-landings"
import { formatWorkshopDateTime } from "@/lib/pregatire/dates"
import { WORKSHOP_SUBJECT_LABELS, type WorkshopPublic } from "@/lib/pregatire/types"

export function PlanckWeekSubjectLandingPage({ landing }: { landing: PlanckWeekSubjectLanding }) {
  const [open, setOpen] = useState(false)
  const [workshop, setWorkshop] = useState<WorkshopPublic | null>(null)
  const [faqId, setFaqId] = useState<string | null>(landing.faq[0]?.id ?? null)
  const teacher = getPlanckWeekLandingTeacher(landing)
  const videoUrl = getPlanckWeekLandingVideoUrl(landing)
  const videoId = videoUrl ? extractYouTubeVideoId(videoUrl) : null
  const instagram = teacher ? landingInstagramHandle(teacher.instagram) : null
  const instagramHref = teacher ? landingInstagramHref(teacher.instagram) : null
  const subjectLabel = WORKSHOP_SUBJECT_LABELS[landing.subject]
  const otherLandings = PLANCK_WEEK_LANDING_SLUGS.filter((slug) => slug !== landing.slug)

  const openReserve = useCallback(
    (placement: string) => {
      trackFunnelEvent("cta_clicked", {
        cta_id: "planck_week_subject_reserve",
        placement,
        destination: "lead_form",
        subject: landing.subject,
      })
      setOpen(true)
    },
    [landing.subject],
  )

  useEffect(() => {
    let cancelled = false
    const from = `${PLANCK_WEEK_MOBILE_CALENDAR_FROM}T00:00:00+03:00`
    const to = `${PLANCK_WEEK_MOBILE_CALENDAR_TO}T23:59:59+03:00`
    const params = new URLSearchParams({ from, to, subject: landing.subject })
    void fetch(`/api/pregatire?${params.toString()}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("load")
        return (await response.json()) as { workshops?: WorkshopPublic[] }
      })
      .then((payload) => {
        if (cancelled) return
        const next = (payload.workshops ?? []).find((item) => item.subject === landing.subject) ?? null
        setWorkshop(next)
      })
      .catch(() => {
        if (!cancelled) setWorkshop(null)
      })
    return () => {
      cancelled = true
    }
  }, [landing.subject])

  return (
    <div className="relative min-h-screen bg-white pb-16 sm:pb-0">
      <PlanckWeekSignupDeadlineBanner />
      <section
        id="planck-week-hero"
        className="relative overflow-hidden bg-[linear-gradient(to_bottom,#c8e6ff_0%,#e8f4ff_16%,#ffffff_38%)]"
      >
        <Landing1LeuHeroConfetti />
        <HomePageNavbar variant="light" />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-10 pt-[9.25rem] text-center sm:px-6 sm:pb-14 sm:pt-[10.5rem] lg:px-8 lg:pb-16 lg:pt-[11.5rem]">
          <FadeInUp>
            <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3.5 py-1.5 text-xs font-black tracking-wider text-white shadow-[0_4px_16px_rgba(124,92,252,0.28)]">
              {PLANCK_WEEK_DATES} · {subjectLabel}
            </span>
          </FadeInUp>

          <FadeInUp delay={0.08}>
            <h1 className="mt-5 text-3xl font-black leading-[1.12] tracking-tight text-gray-900 sm:text-5xl sm:leading-[1.08]">
              {landing.headline}
            </h1>
            <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
          </FadeInUp>

          <FadeInUp delay={0.14}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg sm:leading-8">
              {landing.subhead}
            </p>
          </FadeInUp>

          {workshop ? (
            <FadeInUp delay={0.18}>
              <p className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-[#EBE8FF]">
                <Clock className="h-4 w-4 text-[#7C5CFC]" />
                <span className="capitalize">{formatWorkshopDateTime(workshop.starts_at)}</span>
                {workshop.seats_remaining === 0 ? (
                  <span className="text-rose-600">· locuri epuizate</span>
                ) : workshop.seats_remaining != null ? (
                  <span className="text-gray-500">· {workshop.seats_remaining} locuri</span>
                ) : null}
              </p>
            </FadeInUp>
          ) : null}

          <FadeInUp delay={0.22} className="mt-8">
            <PlanckWeekCtaButton onClick={() => openReserve("hero")} label={landing.cta} />
          </FadeInUp>
          <FadeInUp delay={0.26}>
            <p className="mt-2.5 text-sm leading-relaxed text-gray-500">{PLANCK_WEEK_MICROCOPY}</p>
          </FadeInUp>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <FadeInUp className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              De ce să stai o oră
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-500">
              {landing.sessionPromise}
            </p>
          </FadeInUp>
          <div className="mt-10 space-y-4">
            {landing.whyHour.map((item, index) => (
              <FadeInUp key={item.title} delay={0.06 * index}>
                <article className="rounded-2xl border border-[#EBE8FF] bg-[#F8F7FF] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7C5CFC] text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-gray-900">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600 sm:text-base">{item.body}</p>
                    </div>
                  </div>
                </article>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {teacher ? (
        <section className="bg-[#F8F7FF] px-4 py-16 sm:py-20">
          <div className="mx-auto grid max-w-4xl items-center gap-10 sm:grid-cols-[minmax(0,280px)_1fr] sm:gap-12">
            <FadeInUp>
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.06]">
                {teacher.imageSrc ? (
                  <Image
                    src={teacher.imageSrc}
                    alt={teacher.name}
                    fill
                    className="object-cover"
                    style={{ objectPosition: teacher.imagePosition ?? "center" }}
                    sizes="280px"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-black text-[#7C5CFC]">
                    {teacher.name.slice(0, 1)}
                  </div>
                )}
              </div>
            </FadeInUp>
            <FadeInUp delay={0.08}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C5CFC]">Cine predă</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900">{teacher.name}</h2>
              {instagram && instagramHref ? (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-[#7C5CFC]"
                >
                  {instagram}
                </a>
              ) : null}
              <p className="mt-4 text-base leading-relaxed text-gray-600">{landing.whyTeacher}</p>
              {teacher.description ? (
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{teacher.description}</p>
              ) : null}
              <div className="mt-8">
                <PlanckWeekCtaButton onClick={() => openReserve("teacher")} label={landing.cta} />
              </div>
            </FadeInUp>
          </div>
        </section>
      ) : null}

      {videoId ? (
        <section className="bg-white px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-sm text-center">
            <FadeInUp>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">Vezi cum predă</h2>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Un fragment scurt, din meditațiile live — aceeași energie pe care o prinzi în ora de{" "}
                {subjectLabel.toLowerCase()}.
              </p>
            </FadeInUp>
            <FadeInUp delay={0.1} className="mt-8">
              <div className="overflow-hidden rounded-[24px] shadow-[0_12px_32px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.06]">
                <LazyYouTubePlayer
                  videoId={videoId}
                  title={`${teacher?.name ?? subjectLabel} · ${subjectLabel}`}
                  caption={`${teacher?.name ?? subjectLabel} · ${subjectLabel}`}
                  aspect="9/16"
                  className="rounded-none shadow-none"
                />
              </div>
            </FadeInUp>
          </div>
        </section>
      ) : null}

      <section className="bg-white px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <FadeInUp className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Ce primești</h2>
          </FadeInUp>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {landing.benefits.map((item, index) => (
              <FadeInUp key={item.title} delay={0.06 * index}>
                <article className="h-full rounded-2xl border border-[#EBE8FF] bg-[#F8F7FF] p-5">
                  <h3 className="font-bold tracking-tight text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
                </article>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      <section>
        <PlanckWeekFaqTeacher />
        <div className="bg-[#F8F7FF] pb-20 pt-8 sm:pb-28 sm:pt-10">
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
              {landing.faq.map((item) => {
                const openItem = faqId === item.id
                return (
                  <div key={item.id} className="py-5">
                    <button
                      type="button"
                      onClick={() => setFaqId(openItem ? null : item.id)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                      aria-expanded={openItem}
                    >
                      <span className="text-base font-semibold text-gray-900 sm:text-lg">
                        {item.question}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F8F7FF] text-gray-500">
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
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EBE8FF] opacity-50 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Rezervă ora de {subjectLabel}. Gratuit.
          </h2>
          <p className="mt-4 text-base text-gray-500 sm:text-lg">
            Locurile sunt limitate, ca mentorul să poată răspunde fiecărui elev.
          </p>
          <div className="mt-10">
            <PlanckWeekCtaButton onClick={() => openReserve("final")} label={landing.cta} />
          </div>
          <p className="mt-3 text-sm text-gray-500">Fără card. Anulezi oricând după Planck Week.</p>
        </div>
      </section>

      <nav className="border-t border-[#EBE8FF] bg-[#F8F7FF] px-4 py-10" aria-label="Celelalte materii Planck Week">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="text-sm font-semibold text-gray-500">Sau vezi altă materie</p>
          <div className="flex flex-wrap justify-center gap-2">
            {otherLandings.map((slug) => (
              <Link
                key={slug}
                href={getPlanckWeekSubjectLandingPath(slug)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-800 ring-1 ring-[#EBE8FF] transition hover:ring-[#7C5CFC]"
              >
                {WORKSHOP_SUBJECT_LABELS[PLANCK_WEEK_SUBJECT_LANDINGS[slug].subject]}
              </Link>
            ))}
            <Link
              href="/planck-week"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#7C5CFC]"
            >
              Toate materiile
            </Link>
          </div>
        </div>
      </nav>

      <Footer theme="light" backgroundColor="bg-[#F8F7FF]" borderColor="border-gray-200" />
      <PlanckWeekStickyMobileCta
        hidden={open}
        onReserve={() => openReserve("sticky")}
        label={landing.cta}
      />
      <PlanckWeekLeadForm
        open={open}
        onOpenChange={setOpen}
        lockSubject={landing.subject}
      />
    </div>
  )
}

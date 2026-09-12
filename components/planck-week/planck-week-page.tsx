"use client"

import { useCallback, useEffect, useState } from "react"
import { LandingTeachersSection } from "@/components/landing/teachers-section"
import { LandingWorkshopsCalendarSection } from "@/components/landing/workshops-calendar-section"
import { Footer } from "@/components/footer"
import { HomepageMobileReviewsBar } from "@/components/homepage-mobile-reviews-bar"
import { PlanckWeekHeroSection } from "@/components/planck-week/hero-section"
import { PlanckWeekFaqSection } from "@/components/planck-week/faq-section"
import { PlanckWeekTeacherVideosSection } from "@/components/planck-week/teacher-videos-section"
import { PlanckWeekFinalCtaSection } from "@/components/planck-week/final-cta-section"
import { PlanckWeekStickyMobileCta } from "@/components/planck-week/sticky-mobile-cta"
import { PlanckWeekLeadForm } from "@/components/planck-week/lead-form"
import { PlanckWeekCtaButton } from "@/components/planck-week/cta-button"
import { PlanckWeekSignupDeadlineBanner } from "@/components/planck-week/signup-deadline-banner"
import {
  PLANCK_WEEK_CALENDAR_SUBTITLE,
  PLANCK_WEEK_CALENDAR_TITLE,
  PLANCK_WEEK_CTA,
  PLANCK_WEEK_MOBILE_CALENDAR_FROM,
  PLANCK_WEEK_MOBILE_CALENDAR_TO,
} from "@/lib/planck-week"
import { trackFunnelEvent } from "@/lib/funnel-analytics"
import type { WorkshopSubject } from "@/lib/pregatire/types"

export function PlanckWeekPage() {
  const [open, setOpen] = useState(false)
  const [reserveSubject, setReserveSubject] = useState<WorkshopSubject | null>(null)
  const [pastHero, setPastHero] = useState(false)

  const openReserve = useCallback((placement: string, subject?: WorkshopSubject) => {
    trackFunnelEvent("cta_clicked", {
      cta_id: "planck_week_reserve",
      placement,
      destination: "lead_form",
    })
    setReserveSubject(subject ?? null)
    setOpen(true)
  }, [])

  useEffect(() => {
    const hero = document.getElementById("planck-week-hero")
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastHero(!entry.isIntersecting)
      },
      { threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative min-h-screen bg-white pb-16 sm:pb-0">
      <PlanckWeekSignupDeadlineBanner />
      <PlanckWeekHeroSection onReserve={() => openReserve("planck_week_hero")} />
      <LandingWorkshopsCalendarSection
        title={PLANCK_WEEK_CALENDAR_TITLE}
        subtitle={PLANCK_WEEK_CALENDAR_SUBTITLE}
        showTeacher
        onReserve={(subject) => openReserve("planck_week_calendar", subject)}
        reserveLabel={PLANCK_WEEK_CTA}
        mobileDayFrom={PLANCK_WEEK_MOBILE_CALENDAR_FROM}
        mobileDayTo={PLANCK_WEEK_MOBILE_CALENDAR_TO}
        cta={<PlanckWeekCtaButton onClick={() => openReserve("planck_week_calendar")} />}
      />
      <LandingTeachersSection />
      <PlanckWeekTeacherVideosSection />
      <PlanckWeekFaqSection />
      <PlanckWeekFinalCtaSection onReserve={() => openReserve("planck_week_final")} />
      <Footer theme="light" backgroundColor="bg-[#F8F7FF]" borderColor="border-gray-200" />
      <HomepageMobileReviewsBar placement="top" visible={pastHero && !open} />
      <PlanckWeekStickyMobileCta
        hidden={open}
        onReserve={() => openReserve("planck_week_sticky")}
      />
      <PlanckWeekLeadForm
        open={open}
        initialSubject={reserveSubject}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setReserveSubject(null)
        }}
      />
    </div>
  )
}

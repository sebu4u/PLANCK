"use client"

import { useCallback, useState } from "react"
import { LandingTeachersSection } from "@/components/landing/teachers-section"
import { LandingWorkshopsCalendarSection } from "@/components/landing/workshops-calendar-section"
import { LandingHeroTestimonialsRow } from "@/components/landing/hero-review-rows"
import { Footer } from "@/components/footer"
import { PlanckWeekHeroSection } from "@/components/planck-week/hero-section"
import { PlanckWeekFaqSection } from "@/components/planck-week/faq-section"
import { PlanckWeekTeacherVideosSection } from "@/components/planck-week/teacher-videos-section"
import { PlanckWeekFinalCtaSection } from "@/components/planck-week/final-cta-section"
import { PlanckWeekStickyMobileCta } from "@/components/planck-week/sticky-mobile-cta"
import { PlanckWeekReserveModal } from "@/components/planck-week/reserve-modal"
import { PlanckWeekCtaButton } from "@/components/planck-week/cta-button"
import { PLANCK_WEEK_CTA, PLANCK_WEEK_MOBILE_CALENDAR_FROM, PLANCK_WEEK_MOBILE_CALENDAR_TO } from "@/lib/planck-week"
import { trackFunnelEvent } from "@/lib/funnel-analytics"

export function PlanckWeekPage() {
  const [open, setOpen] = useState(false)

  const openReserve = useCallback((placement: string) => {
    trackFunnelEvent("cta_clicked", {
      cta_id: "planck_week_reserve",
      placement,
      destination: "reserve_modal",
    })
    setOpen(true)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white pb-16 sm:pb-0">
      <PlanckWeekHeroSection onReserve={() => openReserve("planck_week_hero")} />
      <LandingHeroTestimonialsRow />
      <LandingWorkshopsCalendarSection
        title="Orarul meditațiilor din Planck Week"
        onReserve={() => openReserve("planck_week_calendar")}
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
      <PlanckWeekStickyMobileCta onReserve={() => openReserve("planck_week_sticky")} />
      <PlanckWeekReserveModal open={open} onOpenChange={setOpen} />
    </div>
  )
}

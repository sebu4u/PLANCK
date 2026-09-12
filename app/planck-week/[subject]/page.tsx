import { Metadata } from "next"
import { notFound } from "next/navigation"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { PlanckWeekFizicaLandingPage } from "@/components/planck-week/fizica-landing-page"
import { PlanckWeekSubjectLandingPage } from "@/components/planck-week/subject-landing-page"
import { generateMetadata as buildMetadata, pageTitle } from "@/lib/metadata"
import {
  getPlanckWeekSubjectLanding,
  PLANCK_WEEK_LANDING_SLUGS,
} from "@/lib/planck-week-subject-landings"
import { PLATFORM_SITE_URL } from "@/lib/platform-marketing"

export const revalidate = 3600
export const dynamicParams = false

type PageProps = {
  params: Promise<{ subject: string }>
}

export function generateStaticParams() {
  return PLANCK_WEEK_LANDING_SLUGS.map((subject) => ({ subject }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject } = await params
  const landing = getPlanckWeekSubjectLanding(subject)
  if (!landing) return {}

  const path = `/planck-week/${landing.slug}`
  return buildMetadata("planck-week", {
    title: pageTitle(landing.seoTitle),
    description: landing.seoDescription,
    keywords: `planck week, meditatie ${landing.slug}, meditatii gratuite, ${landing.slug} live, olimpici`,
    alternates: { canonical: path },
    openGraph: {
      title: landing.seoTitle,
      description: landing.seoDescription,
      url: `${PLATFORM_SITE_URL}${path}`,
    },
    twitter: {
      title: landing.seoTitle,
      description: landing.seoDescription,
    },
  })
}

export default async function PlanckWeekSubjectRoute({ params }: PageProps) {
  const { subject } = await params
  const landing = getPlanckWeekSubjectLanding(subject)
  if (!landing) notFound()

  return (
    <ScrollAnimationProvider enableSmoothScroll={false}>
      {landing.slug === "fizica" ? (
        <PlanckWeekFizicaLandingPage key={landing.slug} landing={landing} />
      ) : (
        <PlanckWeekSubjectLandingPage key={landing.slug} landing={landing} />
      )}
    </ScrollAnimationProvider>
  )
}

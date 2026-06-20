import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import {
  getPersonalizedCourseWithStructure,
} from "@/lib/personalized-courses/data"
import { PersonalizedCourseOverview } from "@/components/invata/personalized-course-overview"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>
}): Promise<Metadata> {
  const { courseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return generatePageMetadata("learning-paths")

  const course = await getPersonalizedCourseWithStructure(supabase, user.id, courseId)
  if (!course) return generatePageMetadata("learning-paths")

  return {
    title: `${course.title} | Curs personalizat | PLANCK`,
    description: course.description ?? `Curs personalizat Planck: ${course.title}.`,
  }
}

export default async function PersonalizedCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invata/personalizat/${courseId}`)
  }

  const access = await getLearningPathAccess(null)
  if (access.mode !== "full") {
    redirect(`/abonament?next=/invata/personalizat/${courseId}`)
  }

  const course = await getPersonalizedCourseWithStructure(supabase, user.id, courseId)
  if (!course) {
    notFound()
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#ffffff] pt-16 burger:pt-28 sm:pt-16">
        <PersonalizedCourseOverview course={course} />
      </main>
    </>
  )
}

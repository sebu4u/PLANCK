import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import {
  getPersonalizedCourseWithStructure,
} from "@/lib/personalized-courses/data"
import { PersonalizedLessonOverview } from "@/components/invata/personalized-lesson-overview"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import type { PersonalizedCourseWithStructure } from "@/lib/personalized-courses/types"

export const dynamic = "force-dynamic"

async function resolveCourseAndLesson(
  courseId: string,
  lessonId: string,
): Promise<{ course: PersonalizedCourseWithStructure } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const course = await getPersonalizedCourseWithStructure(supabase, user.id, courseId)
  if (!course) return null
  if (!course.lessons.some((lesson) => lesson.id === lessonId)) return null
  return { course }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}): Promise<Metadata> {
  const { courseId, lessonId } = await params
  const resolved = await resolveCourseAndLesson(courseId, lessonId)
  if (!resolved) return generatePageMetadata("learning-paths")
  const lesson = resolved.course.lessons.find((entry) => entry.id === lessonId)!
  return {
    title: `${lesson.title} | ${resolved.course.title} | PLANCK`,
    description: lesson.description ?? `Lecție din cursul personalizat ${resolved.course.title}.`,
  }
}

export default async function PersonalizedLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invata/personalizat/${courseId}/${lessonId}`)
  }

  const access = await getLearningPathAccess(null)
  if (access.mode !== "full") {
    redirect(`/abonament?next=/invata/personalizat/${courseId}/${lessonId}`)
  }

  const course = await getPersonalizedCourseWithStructure(supabase, user.id, courseId)
  if (!course) {
    notFound()
  }

  const lesson = course.lessons.find((entry) => entry.id === lessonId)
  if (!lesson) {
    notFound()
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#ffffff] pt-16 burger:pt-28 sm:pt-16">
        <PersonalizedLessonOverview course={course} lessonId={lesson.id} />
      </main>
    </>
  )
}

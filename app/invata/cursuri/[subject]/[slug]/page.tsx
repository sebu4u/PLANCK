import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { PhysicsLessonsClient } from "@/components/physics-lessons-client"
import { generateMetadata as generatePageMetadata, dynamicTitleSegment } from "@/lib/metadata"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { findLessonIdBySlug, loadCursuriCatalog } from "@/lib/cursuri-catalog"
import {
  cursuriSubjectHref,
  getCursuriSubject,
  isCursuriSubjectId,
  isCursuriSubjectLocked,
  PUBLIC_CURSURI_SUBJECT_IDS,
} from "@/lib/cursuri-subjects"
import { slugify } from "@/lib/slug"

export const revalidate = 2592000 // 30 days

export async function generateStaticParams() {
  const params: { subject: string; slug: string }[] = []

  for (const subject of PUBLIC_CURSURI_SUBJECT_IDS) {
    const { grades, chapters, lessons } = await loadCursuriCatalog(subject)
    for (const grade of grades) {
      for (const chapter of chapters[grade.id] ?? []) {
        for (const lesson of lessons[chapter.id] ?? []) {
          params.push({ subject, slug: slugify(lesson.title) })
        }
      }
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; slug: string }>
}): Promise<Metadata> {
  const { subject: raw, slug } = await params
  if (!isCursuriSubjectId(raw) || isCursuriSubjectLocked(raw)) {
    return generatePageMetadata("physics-lessons")
  }

  const subjectConfig = getCursuriSubject(raw)!
  const { grades, chapters, lessons } = await loadCursuriCatalog(raw)
  const lessonId = findLessonIdBySlug(grades, chapters, lessons, slug, slugify)

  let title: string | null = null
  let duration: number | null = null
  if (lessonId) {
    for (const grade of grades) {
      for (const chapter of chapters[grade.id] ?? []) {
        const found = (lessons[chapter.id] ?? []).find((l) => l.id === lessonId)
        if (found) {
          title = found.title
          duration = found.estimated_duration
          break
        }
      }
      if (title) break
    }
  }

  if (!title) {
    return generatePageMetadata("physics-lessons")
  }

  return {
    title: dynamicTitleSegment(title),
    description: `Lecție de ${subjectConfig.label.toLowerCase()}: ${title}. Durată estimată: ${duration || 0} minute.`,
    keywords: `lecție ${subjectConfig.label}, ${title}, cursuri ${subjectConfig.label}`,
    alternates: {
      canonical: cursuriSubjectHref(raw, slug),
    },
    openGraph: {
      title: `${title} | PLANCK`,
      description: `Lecție de ${subjectConfig.label.toLowerCase()}: ${title}`,
      url: `https://www.planck.academy${cursuriSubjectHref(raw, slug)}`,
      type: "article",
      images: [
        {
          url: "https://i.ibb.co/DHgVg7gr/Untitled-design-4.png",
          width: 1200,
          height: 630,
          alt: `PLANCK - ${title}`,
        },
      ],
    },
    twitter: {
      title: `${title} | PLANCK`,
      description: `Lecție de ${subjectConfig.label.toLowerCase()}: ${title}`,
      images: ["https://i.ibb.co/DHgVg7gr/Untitled-design-4.png"],
      card: "summary_large_image",
    },
  }
}

export default async function InvataCursuriLessonPage({
  params,
}: {
  params: Promise<{ subject: string; slug: string }>
}) {
  const { subject: raw, slug } = await params
  if (!isCursuriSubjectId(raw) || isCursuriSubjectLocked(raw)) notFound()

  const subjectConfig = getCursuriSubject(raw)!
  const { grades, chapters, lessons } = await loadCursuriCatalog(raw)
  const initialLessonId = findLessonIdBySlug(grades, chapters, lessons, slug, slugify)

  if (!initialLessonId) {
    notFound()
  }

  const breadcrumbs = breadcrumbStructuredData([
    { name: "Acasă", url: "https://www.planck.academy/" },
    { name: "Învață", url: "https://www.planck.academy/invata" },
    { name: "Cursuri", url: "https://www.planck.academy/invata/cursuri" },
    { name: subjectConfig.label, url: `https://www.planck.academy${cursuriSubjectHref(raw)}` },
  ])

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFD] text-gray-900">
      <Navigation />

      <div className="pt-16 h-full">
        <StructuredData data={breadcrumbs} />
        <PhysicsLessonsClient
          grades={grades}
          chapters={chapters}
          lessons={lessons}
          initialLessonId={initialLessonId}
          subject={raw}
        />
      </div>
    </div>
  )
}

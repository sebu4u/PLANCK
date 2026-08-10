import { Metadata } from "next"
import { notFound } from "next/navigation"
import { CursuriPageClient } from "@/components/cursuri-page-client"
import { generateMetadata as buildMetadata } from "@/lib/metadata"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { loadCursuriCatalog } from "@/lib/cursuri-catalog"
import {
  cursuriSubjectHref,
  getCursuriSubject,
  isCursuriSubjectId,
} from "@/lib/cursuri-subjects"
import { slugify } from "@/lib/slug"
import type { LessonSummary } from "@/lib/supabase-physics"

export const revalidate = 21600

export async function generateStaticParams() {
  return [
    { subject: "fizica" },
    { subject: "mate" },
    { subject: "info-cpp" },
    { subject: "info-py" },
    { subject: "chimie" },
    { subject: "biologie" },
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>
}): Promise<Metadata> {
  const { subject: raw } = await params
  if (!isCursuriSubjectId(raw)) {
    return buildMetadata("physics-lessons")
  }
  const subject = getCursuriSubject(raw)!
  return {
    ...buildMetadata("physics-lessons"),
    title: `Cursuri ${subject.label} – clase, capitole, lecții | PLANCK`,
    description: subject.description,
    keywords: `cursuri ${subject.label}, lecții ${subject.label}, liceu`,
    alternates: {
      canonical: cursuriSubjectHref(raw),
    },
    openGraph: {
      title: `Cursuri ${subject.label} | PLANCK`,
      description: subject.description,
      url: `https://www.planck.academy${cursuriSubjectHref(raw)}`,
      type: "website",
    },
  }
}

export default async function InvataCursuriSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject: raw } = await params
  if (!isCursuriSubjectId(raw)) notFound()

  const subjectConfig = getCursuriSubject(raw)!
  const { grades, chapters, lessons } = await loadCursuriCatalog(raw)

  const breadcrumbs = breadcrumbStructuredData([
    { name: "Acasă", url: "https://www.planck.academy/" },
    { name: "Învață", url: "https://www.planck.academy/invata" },
    { name: "Cursuri", url: "https://www.planck.academy/invata/cursuri" },
    { name: subjectConfig.label, url: `https://www.planck.academy${cursuriSubjectHref(raw)}` },
  ])

  const allLessons: LessonSummary[] = []
  for (const grade of grades) {
    for (const chapter of chapters[grade.id] ?? []) {
      allLessons.push(...(lessons[chapter.id] ?? []))
    }
  }

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: allLessons
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.planck.academy${cursuriSubjectHref(raw, slugify(lesson.title))}`,
        name: lesson.title,
      })),
  }

  return (
    <div className="h-screen overflow-hidden">
      <StructuredData data={breadcrumbs} />
      <StructuredData data={itemListStructuredData} />
      <CursuriPageClient
        grades={grades}
        chapters={chapters}
        lessons={lessons}
        initialLessonId={undefined}
        subject={raw}
      />
    </div>
  )
}

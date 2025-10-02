import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PhysicsLessonsClient } from "@/components/physics-lessons-client"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { 
  getAllGrades, 
  getChaptersByGradeId, 
  getLessonSummariesByChapterId,
  Grade,
  Chapter,
  LessonSummary
} from "@/lib/supabase-physics"
import { slugify } from "@/lib/slug"

// Dynamic metadata per lesson
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const grades = await getAllGrades()
  let targetLesson: LessonSummary | null = null
  
  for (const grade of grades) {
    const chapters = await getChaptersByGradeId(grade.id)
    for (const chapter of chapters) {
      const lessons = await getLessonSummariesByChapterId(chapter.id)
      const found = lessons.find(l => slugify(l.title) === slug)
      if (found) {
        targetLesson = found
        break
      }
    }
    if (targetLesson) break
  }

  if (!targetLesson) {
    return generatePageMetadata('physics-lessons')
  }

  return {
    title: `${targetLesson.title} | PLANCK`,
    description: `Lecție de fizică: ${targetLesson.title}. Durată estimată: ${targetLesson.estimated_duration || 0} minute.`,
    keywords: `lecție fizică, ${targetLesson.title}, cursuri fizică, educație fizică`,
    alternates: {
      canonical: `/cursuri/${slug}`,
    },
    openGraph: {
      title: `${targetLesson.title} | PLANCK`,
      description: `Lecție de fizică: ${targetLesson.title}`,
      url: `https://www.planck.academy/cursuri/${slug}`,
      type: 'article',
      images: [
        {
          url: 'https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png',
          width: 1200,
          height: 630,
          alt: `PLANCK - ${targetLesson.title}`,
        },
      ],
    },
    twitter: {
      title: `${targetLesson.title} | PLANCK`,
      description: `Lecție de fizică: ${targetLesson.title}`,
      images: ['https://i.ibb.co/3mRP2krf/Logo-text-mai-mic.png'],
      card: 'summary_large_image',
    },
  }
}

export const revalidate = 600

// Generate static params for all lesson slugs
export async function generateStaticParams() {
  const grades = await getAllGrades()
  const allLessons: LessonSummary[] = []
  
  for (const grade of grades) {
    const chapters = await getChaptersByGradeId(grade.id)
    for (const chapter of chapters) {
      const lessons = await getLessonSummariesByChapterId(chapter.id)
      allLessons.push(...lessons)
    }
  }
  
  return allLessons.map(lesson => ({
    slug: slugify(lesson.title)
  }))
}

export default async function PhysicsLessonsBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const grades = await getAllGrades()

  const chaptersData: { [gradeId: string]: Chapter[] } = {}
  for (const grade of grades) {
    chaptersData[grade.id] = await getChaptersByGradeId(grade.id)
  }

  const lessonsData: { [chapterId: string]: LessonSummary[] } = {}
  let initialLessonId: string | undefined = undefined
  for (const grade of grades) {
    for (const chapter of chaptersData[grade.id]) {
      const summaries = await getLessonSummariesByChapterId(chapter.id)
      lessonsData[chapter.id] = summaries
      for (const l of summaries) {
        if (slugify(l.title) === slug) {
          initialLessonId = l.id
        }
      }
    }
  }

  if (!initialLessonId) {
    notFound()
  }

  const breadcrumbs = breadcrumbStructuredData([
    { name: "Acasă", url: "https://www.planck.academy/" },
    { name: "Cursuri", url: "https://www.planck.academy/cursuri" },
  ])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        <StructuredData data={breadcrumbs} />
        <PhysicsLessonsClient 
          grades={grades}
          chapters={chaptersData}
          lessons={lessonsData}
          initialLessonId={initialLessonId}
        />
      </div>

      <Footer />
    </div>
  )
}



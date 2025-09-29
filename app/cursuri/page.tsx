import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PhysicsLessonsClient } from "@/components/physics-lessons-client"
import { generateMetadata } from "@/lib/metadata"
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

export const metadata: Metadata = generateMetadata('physics-lessons')

// Enable SSG with ISR (revalidate every 10 minutes)
export const revalidate = 600

export default async function PhysicsLessonsPage() {
  // Obținem datele din Supabase
  const grades = await getAllGrades()
  
  // Obținem capitolele pentru fiecare clasă
  const chaptersData: { [gradeId: string]: Chapter[] } = {}
  for (const grade of grades) {
    chaptersData[grade.id] = await getChaptersByGradeId(grade.id)
  }
  
  // Obținem rezumatele lecțiilor pentru fiecare capitol (fără content)
  const lessonsData: { [chapterId: string]: LessonSummary[] } = {}
  for (const grade of grades) {
    for (const chapter of chaptersData[grade.id]) {
      lessonsData[chapter.id] = await getLessonSummariesByChapterId(chapter.id)
    }
  }

  // Structured Data: Breadcrumbs și ItemList pentru lecții
  const breadcrumbs = breadcrumbStructuredData([
    { name: "Acasă", url: "https://www.planck.academy/" },
    { name: "Cursuri", url: "https://www.planck.academy/cursuri" },
  ])

  const lessonsListItems = (() => {
    const allLessons: Lesson[] = []
    grades.forEach((grade) => {
      const gradeChapters = chaptersData[grade.id] || []
      gradeChapters.forEach((chapter) => {
        const ls = lessonsData[chapter.id] || []
        allLessons.push(...(ls as any))
      })
    })
    return allLessons
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.planck.academy/cursuri/${(lesson as any).title ? (require('@/lib/slug') as any).slugify((lesson as any).title) : lesson.id}`,
        name: lesson.title,
      }))
  })()

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: lessonsListItems,
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        <StructuredData data={breadcrumbs} />
        <StructuredData data={itemListStructuredData} />
        <PhysicsLessonsClient 
          grades={grades}
          chapters={chaptersData}
          lessons={lessonsData}
          initialLessonId={undefined}
        />
      </div>

      <Footer />
    </div>
  )
}


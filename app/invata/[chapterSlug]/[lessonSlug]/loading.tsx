import { Navigation } from "@/components/navigation"
import { LearningPathLessonPageSkeleton } from "@/components/invata/learning-path-lesson-page-skeleton"

export default function LearningPathLessonLoading() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#ffffff]">
        <LearningPathLessonPageSkeleton />
      </main>
    </>
  )
}

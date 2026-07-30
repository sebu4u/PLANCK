"use client"

import { InvataHubMain } from "@/components/invata/invata-hub-main"
import { InvataMobileHubShell } from "@/components/invata/invata-mobile-hub-shell"
import { InvataHowToLearnCard } from "@/components/invata/invata-how-to-learn-card"
import { InvataPersonalizedCourseEntry } from "@/components/invata/invata-personalized-course-entry"
import { InvataAdminLearningPathsLink } from "@/components/invata/invata-admin-learning-paths-link"
import { InvataSeoIntro } from "@/components/invata/invata-seo-intro"
import {
  LearningPathsList,
  type LessonProgressByLessonId,
} from "@/components/invata/learning-paths-list"
import type {
  LearningPathHubChapter,
  LearningPathHubLesson,
} from "@/lib/supabase-learning-paths"

interface InvataHubPageClientProps {
  chapters: LearningPathHubChapter[]
  archivedChapters: LearningPathHubChapter[]
  lessonsByChapter: Record<string, LearningPathHubLesson[]>
  lockedChapterIds: string[]
  lessonProgressByLessonId: LessonProgressByLessonId
}

function HubLearningPaths(props: InvataHubPageClientProps) {
  return (
    <LearningPathsList
      chapters={props.chapters}
      archivedChapters={props.archivedChapters}
      lessonsByChapter={props.lessonsByChapter}
      lockedChapterIds={props.lockedChapterIds}
      completedLessonIds={[]}
      lessonProgressByLessonId={props.lessonProgressByLessonId}
    />
  )
}

export function InvataHubPageClient(props: InvataHubPageClientProps) {
  return (
    <>
      <div className="sm:hidden">
        <InvataMobileHubShell top={<InvataHowToLearnCard />}>
          <div className="px-5 pt-5">
            <InvataPersonalizedCourseEntry className="mb-6" />
            <HubLearningPaths {...props} />
          </div>
        </InvataMobileHubShell>
      </div>

      <div className="hidden sm:block">
        <InvataHubMain>
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  Trasee de învățare
                </h1>
                <p className="mt-1.5 text-sm text-[#6d6d6d] sm:text-base">
                  Parcurge toată materia de la clasa a IX-a până la a XII-a, pas cu pas
                </p>
              </div>
              <div className="flex w-full max-w-[420px] flex-col items-start gap-3 sm:items-end">
                <InvataPersonalizedCourseEntry className="w-full" />
                <InvataAdminLearningPathsLink />
              </div>
            </header>
            <HubLearningPaths {...props} />
            <InvataSeoIntro />
          </div>
        </InvataHubMain>
      </div>
    </>
  )
}

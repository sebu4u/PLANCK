"use client"

import { useLayoutEffect, useState } from "react"
import { InvataHubMain } from "@/components/invata/invata-hub-main"
import { InvataMobileHubShell } from "@/components/invata/invata-mobile-hub-shell"
import { InvataHowToLearnCard } from "@/components/invata/invata-how-to-learn-card"
import { InvataPersonalizedCourseEntry } from "@/components/invata/invata-personalized-course-entry"
import { InvataAdminLearningPathsLink } from "@/components/invata/invata-admin-learning-paths-link"
import { InvataSeoIntro } from "@/components/invata/invata-seo-intro"
import { InvataHubTabBar } from "@/components/invata/invata-hub-tab-bar"
import { InvataHubLectiiPanel } from "@/components/invata/invata-hub-lectii-panel"
import {
  LearningPathsList,
  type LessonProgressByLessonId,
} from "@/components/invata/learning-paths-list"
import {
  DEFAULT_INVATA_HUB_TAB,
  readStoredInvataHubTab,
  writeStoredInvataHubTab,
  type InvataHubTab,
} from "@/lib/invata-hub-tab"
import {
  DEFAULT_INVATA_SUBJECT_FILTER,
  readStoredInvataSubjectFilter,
  writeStoredInvataSubjectFilter,
  type InvataSubjectFilter,
} from "@/lib/invata-config"
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

function HubLearningPaths({
  subjectFilter,
  showChapterIndicator = false,
  ...props
}: InvataHubPageClientProps & {
  subjectFilter: InvataSubjectFilter
  showChapterIndicator?: boolean
}) {
  return (
    <LearningPathsList
      chapters={props.chapters}
      archivedChapters={props.archivedChapters}
      lessonsByChapter={props.lessonsByChapter}
      lockedChapterIds={props.lockedChapterIds}
      completedLessonIds={[]}
      lessonProgressByLessonId={props.lessonProgressByLessonId}
      subjectFilter={subjectFilter}
      showChapterIndicator={showChapterIndicator}
    />
  )
}

function useInvataHubTab() {
  const [tab, setTab] = useState<InvataHubTab>(DEFAULT_INVATA_HUB_TAB)

  useLayoutEffect(() => {
    setTab(readStoredInvataHubTab())
  }, [])

  const selectTab = (next: InvataHubTab) => {
    setTab(next)
    writeStoredInvataHubTab(next)
  }

  return { tab, selectTab }
}

function useInvataSubjectFilter() {
  const [subjectFilter, setSubjectFilter] = useState<InvataSubjectFilter>(
    DEFAULT_INVATA_SUBJECT_FILTER,
  )

  useLayoutEffect(() => {
    setSubjectFilter(readStoredInvataSubjectFilter())
  }, [])

  const selectSubjectFilter = (next: InvataSubjectFilter) => {
    setSubjectFilter(next)
    writeStoredInvataSubjectFilter(next)
  }

  return { subjectFilter, selectSubjectFilter }
}

export function InvataHubPageClient(props: InvataHubPageClientProps) {
  const { tab, selectTab } = useInvataHubTab()
  const { subjectFilter, selectSubjectFilter } = useInvataSubjectFilter()
  const showTrasee = tab === "trasee"

  return (
    <>
      <div className="sm:hidden">
        <InvataMobileHubShell top={<InvataHowToLearnCard />}>
          <div className="px-5 pt-5">
            <InvataHubTabBar
              value={tab}
              onChange={selectTab}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={selectSubjectFilter}
              className="mb-4"
            />

            {showTrasee ? (
              <>
                <InvataPersonalizedCourseEntry className="mb-6" />
                <HubLearningPaths {...props} subjectFilter={subjectFilter} />
              </>
            ) : (
              <InvataHubLectiiPanel compact className="pb-14" />
            )}
          </div>
        </InvataMobileHubShell>
      </div>

      <div className="hidden sm:block">
        <InvataHubMain>
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
            <InvataHubTabBar
              value={tab}
              onChange={selectTab}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={selectSubjectFilter}
              className="mb-6"
            />

            {showTrasee ? (
              <>
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
                <HubLearningPaths
                  {...props}
                  subjectFilter={subjectFilter}
                  showChapterIndicator
                />
                <InvataSeoIntro />
              </>
            ) : (
              <InvataHubLectiiPanel />
            )}
          </div>
        </InvataHubMain>
      </div>
    </>
  )
}

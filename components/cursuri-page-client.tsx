'use client'

import { useEffect, useState } from 'react'
import { Grade, Chapter, LessonSummary } from '@/lib/supabase-physics'
import { PhysicsLessonsClient } from '@/components/physics-lessons-client'
import { CursuriWelcomeScreen } from '@/components/cursuri-welcome-screen'
import { Navigation } from '@/components/navigation'
import {
  DEFAULT_CURSURI_SUBJECT,
  type CursuriSubjectId,
} from '@/lib/cursuri-subjects'

const WELCOME_STORAGE_KEY = 'planck_cursuri_welcome_seen'

interface CursuriPageClientProps {
  grades: Grade[]
  chapters: { [gradeId: string]: Chapter[] }
  lessons: { [chapterId: string]: LessonSummary[] }
  initialLessonId?: string
  subject?: CursuriSubjectId
}

export function CursuriPageClient({
  grades,
  chapters,
  lessons,
  initialLessonId,
  subject = DEFAULT_CURSURI_SUBJECT,
}: CursuriPageClientProps) {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      if (!isDesktop) {
        setShowWelcome(false)
        return
      }

      const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
      setShowWelcome(!hasSeenWelcome)
    } catch {
      setShowWelcome(true)
    }
  }, [])

  const handleStart = () => {
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, '1')
    } catch {
      // Ignore storage errors and continue to courses.
    }
    setShowWelcome(false)
  }

  if (showWelcome === null) {
    return <div className="h-screen bg-white" />
  }

  if (showWelcome) {
    return <CursuriWelcomeScreen onStart={handleStart} />
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFD] text-gray-900">
      <Navigation />

      <div className="pt-16 h-full relative">
        <PhysicsLessonsClient
          grades={grades}
          chapters={chapters}
          lessons={lessons}
          initialLessonId={initialLessonId}
          subject={subject}
        />
      </div>
    </div>
  )
}

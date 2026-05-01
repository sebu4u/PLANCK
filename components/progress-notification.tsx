"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { EngagementCard } from "@/components/engagement/engagement-card"
import type { EngagementNotification } from "@/lib/engagement/types"

interface Problem {
  id: string
  title: string
  difficulty: string
  category: string
  youtube_url: string
}

export function ProgressNotification() {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [solvedCount, setSolvedCount] = useState(0)
  const [suggestedProblem, setSuggestedProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Verifică dacă utilizatorul este autentificat și dacă notificarea nu a fost închisă
    if (!user) {
      setIsVisible(false)
      return
    }

    if (isDismissed) {
      setIsVisible(false)
      return
    }

    // Verifică dacă notificarea a fost închisă în această sesiune
    const dismissed = sessionStorage.getItem('progress-notification-dismissed')
    if (dismissed) {
      setIsDismissed(true)
      setIsVisible(false)
      return
    }

    const fetchProgressData = async () => {
      try {
        setLoading(true)
        
        // Obține numărul de probleme rezolvate
        const { count } = await supabase
          .from('solved_problems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        const solvedNow = count || 0
        setSolvedCount(solvedNow)

        // Obține problemele rezolvate de utilizator
        const { data: solvedProblems } = await supabase
          .from('solved_problems')
          .select('problem_id')
          .eq('user_id', user.id)

        const solvedIds = solvedProblems?.map(p => p.problem_id) || []

        // Găsește probleme cu video
        const { data: problemsWithVideo } = await supabase
          .from('problems')
          .select('id, title, difficulty, category, youtube_url')
          .not('youtube_url', 'is', null)
          .neq('youtube_url', '')
          .limit(20)

        if (problemsWithVideo && problemsWithVideo.length > 0) {
          // Filtrează problemele rezolvate din JavaScript
          const unsolvedProblems = problemsWithVideo.filter(problem => 
            !solvedIds.includes(problem.id)
          )

          if (unsolvedProblems.length > 0) {
            // Alege o problemă random
            const randomIndex = Math.floor(Math.random() * unsolvedProblems.length)
            setSuggestedProblem(unsolvedProblems[randomIndex])
          } else {
            // Dacă toate problemele cu video sunt rezolvate, caută orice problemă nerezolvată
            const { data: allProblems } = await supabase
              .from('problems')
              .select('id, title, difficulty, category, youtube_url')
              .limit(20)

            if (allProblems && allProblems.length > 0) {
              const unsolvedAll = allProblems.filter(problem => 
                !solvedIds.includes(problem.id)
              )

              if (unsolvedAll.length > 0) {
                const randomIndex = Math.floor(Math.random() * unsolvedAll.length)
                setSuggestedProblem(unsolvedAll[randomIndex])
              }
            }
          }
        }



      } catch (error) {
        console.error('Error fetching progress data:', error)
              } finally {
          setLoading(false)
        }
    }

    fetchProgressData()
  }, [user, isDismissed])

  // Efect separat pentru a gestiona afișarea notificării
  useEffect(() => {
    if (suggestedProblem && !loading && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [suggestedProblem, loading, isDismissed])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    sessionStorage.setItem('progress-notification-dismissed', 'true')
  }

  if (!user || isDismissed || loading || !suggestedProblem) {
    return null
  }

  const notification: EngagementNotification = {
    id: "legacy-progress-notification",
    type: "progress_feedback",
    surface: "card",
    priority: 30,
    dedupeKey: "legacy-progress-notification",
    payload: {
      icon: "progress",
      title: "Progresul tău",
      description:
        solvedCount === 0
          ? `Începe să construiești progresul tău cu „${suggestedProblem.title}”.`
          : solvedCount < 5
            ? `Ai ${solvedCount} probleme rezolvate. Continuă cu „${suggestedProblem.title}”.`
            : `Excelent progres: ${solvedCount} probleme rezolvate. Următoarea sugestie: „${suggestedProblem.title}”.`,
      cta: {
        label: suggestedProblem.youtube_url?.trim() ? "Rezolvă problema cu video" : "Rezolvă problema",
        href: `/probleme/${suggestedProblem.id}`,
      },
    },
  }

  return (
    <EngagementCard
      notification={notification}
      visible={isVisible}
      onDismiss={handleDismiss}
    />
  )
}

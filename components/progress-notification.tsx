"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { X, TrendingUp, PlayCircle } from "lucide-react"
import Link from "next/link"

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

  return (
    <div className={`hidden md:block fixed bottom-6 right-6 z-50 transition-all duration-700 ease-out ${
      isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'
    }`}>
      <div className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 border border-green-200/60 rounded-xl shadow-2xl p-3 md:p-4 max-w-xs md:max-w-sm backdrop-blur-sm transition-all duration-300 hover:from-green-50 hover:to-emerald-50 hover:border-green-200 hover:shadow-2xl">
        {/* Header cu buton de închidere */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-800">Progresul tău</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conținut notificare */}
        <div className="space-y-2 md:space-y-3">
          {/* Progres */}
          <div className="bg-white/40 rounded-lg p-2 md:p-3 transition-all duration-300 hover:bg-white/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-green-700">Probleme rezolvate</span>
              <span className="text-sm font-bold text-green-800">{solvedCount}</span>
            </div>
            <div className="w-full bg-green-200/60 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-1 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((solvedCount / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Problemă sugerată */}
          {suggestedProblem && (
            <div className="bg-white/40 rounded-lg p-2 md:p-3 transition-all duration-300 hover:bg-white/60">
              <div className="flex items-center gap-2 mb-1.5">
                {suggestedProblem.youtube_url && suggestedProblem.youtube_url.trim() !== '' ? (
                  <PlayCircle className="w-3 h-3 text-red-500" />
                ) : (
                  <span className="w-3 h-3 text-green-500">📝</span>
                )}
                <span className="text-xs font-medium text-green-700">
                  {suggestedProblem.youtube_url && suggestedProblem.youtube_url.trim() !== '' 
                    ? "Sugestie cu video" 
                    : "Sugestie pentru tine"}
                </span>
              </div>
              <p className="text-xs text-green-800 mb-1.5 line-clamp-2">
                {suggestedProblem.title}
              </p>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-green-100 text-green-700 rounded-full">
                  {suggestedProblem.difficulty}
                </span>
                <span className="text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-purple-100 text-purple-700 rounded-full">
                  {suggestedProblem.category}
                </span>
              </div>
              <Link href={`/probleme/${suggestedProblem.id}`}>
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium text-xs md:text-sm"
                >
                  Rezolvă problema
                </Button>
              </Link>
            </div>
          )}

          {/* Mesaj motivant */}
          <div className="text-center">
            <p className="text-xs text-green-600/80">
              {solvedCount === 0 
                ? "Începe să construiești progresul tău!" 
                : solvedCount < 5 
                ? "Continuă așa! Fiecare problemă te aduce mai aproape de succes." 
                : "Excelent progres! Ești pe drumul cel bun."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

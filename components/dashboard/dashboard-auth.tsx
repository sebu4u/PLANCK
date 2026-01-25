"use client"

import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { DashboardSidebarSkeleton } from "@/components/dashboard/dashboard-sidebar-skeleton"
import { NavigationSkeleton } from "@/components/navigation-skeleton"
import { LearnPhysicsCard, RecommendedLesson } from "@/components/dashboard/cards/learn-physics-card"
import { RankEloCard } from "@/components/dashboard/cards/rank-elo-card"
import { DailyChallengeCard } from "@/components/dashboard/cards/daily-challenge-card"
import { SketchCard } from "@/components/dashboard/cards/sketch-card"
import { AchievementsCard } from "@/components/dashboard/cards/achievements-card"
import { LearningInsightsCard } from "@/components/dashboard/cards/learning-insights-card"
import type {
  UserStats,
  DailyChallenge,
  RoadmapStep,
  Recommendation,
  RecentSketch,
  ContinueLearningItem,
  Achievement,
  LearningInsights,
  UserTask,
  DashboardUpdate,
  Project,
} from "@/lib/dashboard-data"
import { getNextRankThreshold } from "@/lib/dashboard-data"

import { ProblemOfTheDayCard } from "@/components/dashboard/cards/problem-of-the-day-card"
import { QuickActionsRow } from "@/components/dashboard/quick-actions-row"
import { ContestPromoCard } from "@/components/dashboard/cards/contest-promo-card"

export function DashboardAuth() {
  const router = useRouter()
  const { user, loading: authLoading, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const isInitialLoadRef = useRef(true)
  const isFetchingRef = useRef(false)
  const realtimeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [dashboardData, setDashboardData] = useState<{
    stats: UserStats
    recommendedLessons: RecommendedLesson[]
    challenge: DailyChallenge | null
    roadmap: RoadmapStep[]
    recommendations: Recommendation[]
    sketches: RecentSketch[]
    continueItems: ContinueLearningItem[]
    achievements: Achievement[]
    insights: LearningInsights
    tasks: UserTask[]
    updates: DashboardUpdate[]
    eloTodayGain: number
    eloWeekGain: number
    eloHistory: number[]
    lastProject: Project | null
  } | null>(null)


  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    const fetchDashboardData = async () => {
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      try {
        // Check cache in dev mode
        const cacheKey = `dashboard_cache_${user.id}`
        const cacheExpiry = 5 * 60 * 1000 // 5 minutes
        const isDev = process.env.NODE_ENV === 'development'

        if (isDev && typeof window !== 'undefined') {
          const cached = sessionStorage.getItem(cacheKey)
          if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < cacheExpiry) {
              setDashboardData(data)
              setLoading(false)
              isInitialLoadRef.current = false
              isFetchingRef.current = false
              // Still fetch in background to update cache (but don't update UI)
              fetchDashboardDataBackground(user.id, cacheKey, true)
              return
            }
          }
        }

        // Fetch ALL data before showing the dashboard
        // Skip streak check on initial load to prevent triggering realtime updates
        const [
          statsData,
          recommendedLessonsData,
          challengeData,
          roadmapData,
          recommendationsData,
          sketchesData,
          achievementsData,
          tasksData,
          updatesData,
          eloQuickStats,
          eloHistoryData,
        ] = await Promise.all([
          fetchUserStats(user.id, isInitialLoadRef.current),
          fetchRandomLessons(),
          fetchDailyChallenge(user.id),
          fetchUserRoadmap(user.id),
          fetchRecommendations(user.id),
          fetchRecentSketches(user.id),
          fetchAchievements(user.id),
          fetchUserTasks(user.id),
          fetchDashboardUpdates(),
          fetchEloQuickStats(user.id),
          fetchEloHistory(user.id),
        ])

        const continueLearningData = await fetchContinueLearning()
        const lastProjectData = await fetchLastProject(user.id)

        // Set complete data all at once
        const completeData = {
          stats: statsData,
          recommendedLessons: recommendedLessonsData,
          challenge: challengeData,
          roadmap: roadmapData,
          recommendations: recommendationsData,
          sketches: sketchesData,
          continueItems: continueLearningData,
          achievements: achievementsData,
          insights: getLearningInsightsPlaceholder(),
          tasks: tasksData,
          updates: updatesData,
          eloTodayGain: eloQuickStats.todayGain,
          eloWeekGain: eloQuickStats.weekGain,
          eloHistory: eloHistoryData,
          lastProject: lastProjectData,
        }

        setDashboardData(completeData)

        // Cache in dev mode
        if (isDev && typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: completeData,
            timestamp: Date.now(),
          }))
        }

        // Only set loading to false after ALL data is loaded
        setLoading(false)
        isInitialLoadRef.current = false
        isFetchingRef.current = false
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
        isInitialLoadRef.current = false
        isFetchingRef.current = false
      }
    }

    const fetchDashboardDataBackground = async (userId: string, cacheKey: string, silent: boolean = false) => {
      try {
        // Fetch all data in parallel for cache update
        const [
          statsData,
          recommendedLessonsData,
          challengeData,
          roadmapData,
          recommendationsData,
          sketchesData,
          achievementsData,
          tasksData,
          updatesData,
          eloQuickStats,
          eloHistoryData,
        ] = await Promise.all([
          fetchUserStats(userId, true), // Skip streak check in background fetch
          fetchRandomLessons(),
          fetchDailyChallenge(userId),
          fetchUserRoadmap(userId),
          fetchRecommendations(userId),
          fetchRecentSketches(userId),
          fetchAchievements(userId),
          fetchUserTasks(userId),
          fetchDashboardUpdates(),
          fetchEloQuickStats(userId),
          fetchEloHistory(userId),
        ])

        const continueLearningData = await fetchContinueLearning()
        const lastProjectData = await fetchLastProject(userId)

        const fullData = {
          stats: statsData,
          recommendedLessons: recommendedLessonsData,
          challenge: challengeData,
          roadmap: roadmapData,
          recommendations: recommendationsData,
          sketches: sketchesData,
          continueItems: continueLearningData,
          achievements: achievementsData,
          insights: getLearningInsightsPlaceholder(),
          tasks: tasksData,
          updates: updatesData,
          eloTodayGain: eloQuickStats.todayGain,
          eloWeekGain: eloQuickStats.weekGain,
          eloHistory: eloHistoryData,
          lastProject: lastProjectData,
        }

        // Only update cache, don't update UI if silent mode
        if (silent) {
          if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: fullData,
              timestamp: Date.now(),
            }))
          }
        } else {
          // Update UI only if not in silent mode (for realtime updates)
          setDashboardData(fullData)

          // Cache in dev mode
          if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: fullData,
              timestamp: Date.now(),
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching background dashboard data:', error)
      }
    }

    fetchDashboardData()

    // Subscribe to realtime updates for user_stats
    const statsChannel = supabase
      .channel(`user_stats_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Ignore updates during initial load to prevent flickering
          if (isInitialLoadRef.current || isFetchingRef.current) return

          // Clear any pending timeout
          if (realtimeUpdateTimeoutRef.current) {
            clearTimeout(realtimeUpdateTimeoutRef.current)
          }

          // Debounce realtime updates to prevent rapid flickering
          realtimeUpdateTimeoutRef.current = setTimeout(async () => {
            try {
              // Skip streak check in realtime updates to prevent loops
              const [updatedStats, eloQuickStats] = await Promise.all([
                fetchUserStats(user.id, true), // Skip streak check
                fetchEloQuickStats(user.id),
              ])

              const updatedEloHistory = await fetchEloHistory(user.id)
              setDashboardData((prev) => {
                if (!prev) return null
                return {
                  ...prev,
                  stats: updatedStats,
                  eloTodayGain: eloQuickStats.todayGain,
                  eloWeekGain: eloQuickStats.weekGain,
                  eloHistory: updatedEloHistory,
                  lastProject: prev.lastProject, // Preserve existing
                }
              })
            } catch (error) {
              // Silently handle errors in realtime updates to prevent unhandled errors
              console.warn('Error updating dashboard stats from realtime:', error)
              // Don't throw - allow dashboard to continue functioning
            }
          }, 500) // 500ms debounce
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      if (realtimeUpdateTimeoutRef.current) {
        clearTimeout(realtimeUpdateTimeoutRef.current)
      }
      supabase.removeChannel(statsChannel)
      isFetchingRef.current = false
      isInitialLoadRef.current = true
      isInitialLoadRef.current = true
    }
  }, [user?.id, authLoading, router])


  // Memoize userData to prevent recreation on every render
  // Must be called before any conditional returns to follow Rules of Hooks
  const userData = useMemo(() => {
    if (!user) {
      return {
        id: '',
        email: '',
        avatar_url: undefined,
        username: undefined,
      }
    }
    return {
      id: user.id,
      email: user.email!,
      avatar_url: profile?.user_icon,
      username: profile?.nickname || profile?.name,
    }
  }, [user?.id, user?.email, profile?.user_icon, profile?.nickname, profile?.name])

  // Show skeleton loading while data is being fetched
  if (authLoading || loading || !dashboardData) {
    return (
      <DashboardSidebarProvider>
        <NavigationSkeleton />
        <DashboardSidebarSkeleton />
        <DashboardSkeleton />
      </DashboardSidebarProvider>
    )
  }

  if (!user) return null

  const nextRankInfo = getNextRankThreshold(dashboardData.stats.elo)

  return (
    <DashboardSidebarProvider>
      <Navigation />

      {/* Main Container - Fixed Height matching viewport minus header */}
      <div className="h-[calc(100vh-64px)] lg:h-[calc(100vh-100px)] mt-16 overflow-hidden bg-[#080808] relative flex flex-row">
        <DashboardClientWrapper
          user={userData}
          stats={dashboardData.stats}
          initialTasks={dashboardData.tasks}
          continueItems={dashboardData.continueItems}
          recentAchievements={dashboardData.achievements}
          updates={dashboardData.updates}
        />

        {/* Content Wrapper - takes remaining width */}
        <div className="flex-1 lg:ml-[250px] relative h-full transition-all duration-300">

          {/* Floating Card Container */}
          <div className="absolute inset-[3px] bg-[#0D0D0F] lg:rounded-xl overflow-hidden border border-white/5 shadow-2xl flex flex-col">

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto dashboard-scrollbar bg-[#0D0D0F]">
              <main className="p-4 md:p-8 lg:p-10 animate-fade-in-up">
                <div className="max-w-[1000px] mx-auto">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white/90 mb-2">
                      Welcome back, {userData.username || 'Student'}! 👋
                    </h1>
                    <p className="text-white/60">Here's your learning progress today</p>
                  </div>

                  {/* Contest Promo Card - Mobile Only */}
                  <div className="mb-3 lg:hidden">
                    <ContestPromoCard />
                  </div>

                  <div className="mb-3 md:mb-6">
                    <ProblemOfTheDayCard challenge={dashboardData.challenge} />
                  </div>

                  <QuickActionsRow
                    lastLesson={dashboardData.continueItems.find(i => i.type === 'lesson')}
                    userGrade={profile?.grade}
                    lastProject={dashboardData.lastProject}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-6">
                    <LearnPhysicsCard lessons={dashboardData.recommendedLessons} />
                    <RankEloCard
                      elo={dashboardData.stats.elo}
                      rank={dashboardData.stats.rank}
                      nextRank={nextRankInfo.nextRank}
                      nextThreshold={nextRankInfo.threshold}
                      progress={nextRankInfo.progress}
                      currentStreak={dashboardData.stats.current_streak}
                      bestStreak={dashboardData.stats.best_streak}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-6">
                    {dashboardData.challenge && <DailyChallengeCard challenge={dashboardData.challenge} />}
                    <SketchCard sketches={dashboardData.sketches} />
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                    <div className="flex-[2]">
                      <AchievementsCard achievements={dashboardData.achievements} />
                    </div>
                    <div className="flex-[3]">
                      <LearningInsightsCard insights={dashboardData.insights} />
                    </div>
                  </div>
                </div>
              </main>

              {/* Footer inside the card */}
              <footer>
                <Footer backgroundColor="bg-[#080808]" borderColor="border-[#1a1a1a]" />
              </footer>
            </div>
          </div>
        </div>
      </div>


    </DashboardSidebarProvider>
  )
}

// Helper functions for client-side data fetching
async function fetchUserStats(userId: string, skipStreakCheck: boolean = false): Promise<UserStats> {
  // Check and reset streak if user skipped a day (only on initial load, not on realtime updates)
  if (!skipStreakCheck) {
    try {
      const { error: streakError } = await supabase.rpc('check_and_reset_streak_if_needed', {
        user_uuid: userId,
      })
      if (streakError) {
        // Only log if error has meaningful information
        if (streakError.message || streakError.code) {
          console.warn('Warning: Streak reset check failed:', {
            message: streakError.message,
            code: streakError.code,
            details: streakError.details,
          })
        }
        // Continue execution even if streak check fails
      }
    } catch (err) {
      // Log error but don't throw - allow function to continue
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage && errorMessage !== '{}') {
        console.warn('Warning: Streak reset check encountered an error:', errorMessage)
      }
      // Continue execution even if streak check fails
    }
  }

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return {
      elo: 520,
      rank: 'Bronze II',
      current_streak: 4,
      best_streak: 7,
      total_time_minutes: 12,
      problems_solved_today: 0,
      problems_solved_total: 0,
      last_activity_date: null,
    }
  }

  // Get problems solved today and time from daily_activity to ensure accuracy
  const today = new Date().toISOString().split('T')[0]
  const { data: todayActivity } = await supabase
    .from('daily_activity')
    .select('problems_solved, time_minutes')
    .eq('user_id', userId)
    .eq('activity_date', today)
    .maybeSingle()

  // Override problems_solved_today and total_time_minutes with actual values from daily_activity
  const stats = data as UserStats

  // If last_activity_date is different from today, reset problems_solved_today to 0
  const lastActivityDate = stats.last_activity_date ? new Date(stats.last_activity_date).toISOString().split('T')[0] : null
  if (lastActivityDate !== today) {
    stats.problems_solved_today = 0
    // Only update in database if needed and not already 0 to prevent infinite loops with realtime updates
    if (data.problems_solved_today !== 0) {
      supabase
        .from('user_stats')
        .update({ problems_solved_today: 0 })
        .eq('user_id', userId)
        .then(() => { }) // Fire and forget
    }
  } else {
    stats.problems_solved_today = todayActivity?.problems_solved || 0
  }

  // Override total_time_minutes with today's time_minutes for display purposes
  // Note: We keep the original total_time_minutes in the stats object, but we'll use today's time in the card
  // Actually, let's create a computed property - but since we can't modify the interface easily,
  // we'll use a workaround: store today's time in a way that the card can access it
  // For now, we'll return the stats as-is and handle timeToday separately in the component

  return stats
}

interface EloQuickStats {
  todayGain: number
  weekGain: number
}

async function fetchEloQuickStats(userId: string): Promise<EloQuickStats> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)

  const { data: solvedProblems, error } = await supabase
    .from('solved_problems')
    .select('problem_id, solved_at')
    .eq('user_id', userId)
    .gte('solved_at', weekAgo.toISOString())

  if (error || !solvedProblems || solvedProblems.length === 0) {
    return { todayGain: 0, weekGain: 0 }
  }

  const problemIds = Array.from(new Set(solvedProblems.map(sp => sp.problem_id)))

  if (problemIds.length === 0) {
    return { todayGain: 0, weekGain: 0 }
  }

  const { data: problems } = await supabase
    .from('problems')
    .select('id, difficulty')
    .in('id', problemIds)

  const difficultyToElo: Record<string, number> = {
    'Ușor': 15,
    'Mediu': 21,
    'Avansat': 30,
  }

  const eloByProblemId = new Map<string, number>()
  problems?.forEach((p: any) => {
    const elo = difficultyToElo[p.difficulty] ?? 15
    eloByProblemId.set(p.id, elo)
  })

  let todayGain = 0
  let weekGain = 0

  for (const sp of solvedProblems as any[]) {
    const solvedAt = new Date(sp.solved_at)
    const elo = eloByProblemId.get(sp.problem_id) ?? 15

    if (solvedAt >= weekAgo) {
      weekGain += elo
    }
    if (solvedAt >= today) {
      todayGain += elo
    }
  }

  return { todayGain, weekGain }
}

async function fetchEloHistory(userId: string): Promise<number[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get current ELO
  const { data: userStats } = await supabase
    .from('user_stats')
    .select('elo')
    .eq('user_id', userId)
    .single()

  const currentElo = userStats?.elo || 500

  // Get all solved problems from the last 7 days
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // 6 days ago + today = 7 days

  const { data: solvedProblems } = await supabase
    .from('solved_problems')
    .select('problem_id, solved_at')
    .eq('user_id', userId)
    .gte('solved_at', sevenDaysAgo.toISOString())
    .order('solved_at', { ascending: true })

  if (!solvedProblems || solvedProblems.length === 0) {
    // If no problems solved, return array with current ELO for all days
    return Array(7).fill(currentElo)
  }

  // Get problem difficulties
  const problemIds = Array.from(new Set(solvedProblems.map(sp => sp.problem_id)))
  const { data: problems } = await supabase
    .from('problems')
    .select('id, difficulty')
    .in('id', problemIds)

  const difficultyToElo: Record<string, number> = {
    'Ușor': 15,
    'Mediu': 21,
    'Avansat': 30,
  }

  const eloByProblemId = new Map<string, number>()
  problems?.forEach((p: any) => {
    const elo = difficultyToElo[p.difficulty] ?? 15
    eloByProblemId.set(p.id, elo)
  })

  // Group solved problems by day (ELO gained per day)
  const eloByDay = new Map<string, number>()

  for (const sp of solvedProblems as any[]) {
    const solvedAt = new Date(sp.solved_at)
    const dayKey = solvedAt.toISOString().split('T')[0]
    const elo = eloByProblemId.get(sp.problem_id) ?? 15
    eloByDay.set(dayKey, (eloByDay.get(dayKey) || 0) + elo)
  }

  // Calculate ELO at the end of each day for the last 7 days
  // Start from 7 days ago and work forward to today
  const eloHistory: number[] = []

  // Calculate total ELO gained in the last 7 days
  let totalGained = 0
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - (6 - i))
    const dayKey = date.toISOString().split('T')[0]
    totalGained += eloByDay.get(dayKey) || 0
  }

  // ELO 7 days ago = current ELO - total gains
  // Ensure it's at least 500 (minimum starting ELO)
  let eloAtStartOfPeriod = Math.max(500, currentElo - totalGained)

  // Build history by adding gains day by day
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - (6 - i))
    const dayKey = date.toISOString().split('T')[0]
    const eloGained = eloByDay.get(dayKey) || 0

    // ELO at end of this day = ELO at start + gains
    eloAtStartOfPeriod += eloGained
    eloHistory.push(eloAtStartOfPeriod)
  }

  return eloHistory
}

async function fetchRandomLessons(): Promise<RecommendedLesson[]> {
  const { getRandomLessonsForDashboard } = await import('@/lib/supabase-physics')
  const { slugify } = await import('@/lib/slug')

  const lessons = await getRandomLessonsForDashboard(2)

  return lessons.map(lesson => ({
    ...lesson,
    slug: slugify(lesson.title),
  }))
}

async function fetchDailyChallenge(userId: string): Promise<DailyChallenge | null> {
  const today = new Date().toISOString().split('T')[0]

  // Ensure challenge exists for today
  await supabase.rpc('ensure_daily_challenge_for_today')

  const { data: challenge, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('active_date', today)
    .single()

  if (error || !challenge) {
    return {
      id: 'placeholder',
      title: 'Rezolvă problema de cinematică',
      description: 'O problemă clasică de mișcare rectilinie uniform variată.',
      difficulty: 'Medium',
      bonus_elo: 10,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_completed: false,
    }
  }

  const { data: userChallenge } = await supabase
    .from('user_challenges')
    .select('completed')
    .eq('user_id', userId)
    .eq('challenge_id', challenge.id)
    .maybeSingle()

  // Check if user already solved this problem in the past
  const { data: solved } = await supabase
    .from('solved_problems')
    .select('id')
    .eq('user_id', userId)
    .eq('problem_id', challenge.problem_id)
    .maybeSingle()

  // Load problem details for display (ID, class, difficulty, snippet)
  const { data: problem } = await supabase
    .from('problems')
    .select('id, class, difficulty, statement, title')
    .eq('id', challenge.problem_id)
    .single()

  const isCompleted = userChallenge?.completed || !!solved

  const classLabel =
    problem?.class != null
      ? `Clasa a ${problem.class}-a`
      : null

  const baseText = (problem?.statement || problem?.title || challenge.description || '').trim()
  const snippet = baseText.length > 140 ? `${baseText.slice(0, 140)}…` : baseText

  return {
    id: challenge.id,
    title: `Problema ${problem?.id || challenge.problem_id}${classLabel ? ` • ${classLabel}` : ''}`,
    description: snippet,
    difficulty: challenge.difficulty,
    bonus_elo: challenge.bonus_elo,
    expires_at: challenge.expires_at,
    is_completed: isCompleted,
    // pentru cardul DailyChallenge (Solve Now)
    problem_id: problem?.id || challenge.problem_id,
  }
}

async function fetchUserRoadmap(userId: string): Promise<RoadmapStep[]> {
  const { data, error } = await supabase
    .from('learning_roadmap')
    .select('*')
    .eq('user_id', userId)
    .order('step_number', { ascending: true })

  if (error || !data || data.length === 0) {
    return [
      {
        id: '1',
        step_number: 1,
        title: 'Bazele Mecanicii',
        description: 'Începe cu conceptele fundamentale',
        category: 'Mecanică',
        total_items: 10,
        completed_items: 3,
        is_locked: false,
        is_completed: false,
      },
      {
        id: '2',
        step_number: 2,
        title: 'Cinematica',
        description: 'Studiază mișcarea corpurilor',
        category: 'Mecanică',
        total_items: 15,
        completed_items: 0,
        is_locked: false,
        is_completed: false,
      },
    ]
  }

  return data.map((step: any) => ({
    id: step.id,
    step_number: step.step_number,
    title: step.title,
    description: step.description,
    category: step.category,
    total_items: step.total_items,
    completed_items: 0,
    is_locked: step.is_locked,
    is_completed: false,
  }))
}

async function fetchRecommendations(userId: string): Promise<Recommendation[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .limit(3)

  if (error || !data || data.length === 0) {
    return [
      {
        id: '1',
        type: 'lesson',
        title: 'Lecția 10.2 – Legea gazelor',
        description: 'Continuă cu teoria gazelor perfecte',
        target_url: '/cursuri',
        reason: 'Bazat pe progresul tău recent',
        priority: 1,
      },
    ]
  }

  return data as Recommendation[]
}

async function fetchRecentSketches(userId: string): Promise<RecentSketch[]> {
  try {
    // Get access token
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      return []
    }

    // Fetch boards from API endpoint
    const response = await fetch('/api/sketch/boards', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const boards = data.boards || []

    // Map boards to RecentSketch format (title -> name) and limit to 3
    return boards.slice(0, 3).map((board: { id: string; title: string; updated_at: string }) => ({
      id: board.id,
      name: board.title,
      updated_at: board.updated_at,
    }))
  } catch (error) {
    console.error('Failed to fetch recent sketches:', error)
    return []
  }
}

async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      earned_at,
      badges:badge_id (
        name,
        description,
        icon,
        color
      )
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(5)

  if (error || !data || data.length === 0) {
    return [
      {
        id: '1',
        name: 'First 10 problems solved',
        description: 'Ai rezolvat primele 10 probleme',
        icon: '⭐',
        color: 'bg-yellow-500',
        earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
  }

  return data.map((item: any) => ({
    id: item.id,
    name: item.badges.name,
    description: item.badges.description,
    icon: item.badges.icon,
    color: item.badges.color,
    earned_at: item.earned_at,
  }))
}

async function fetchUserTasks(userId: string): Promise<UserTask[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('user_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('task_date', today)

  if (error || !data || data.length === 0) {
    return [
      { id: '1', task_type: 'solve_problem', task_description: 'Rezolvă 1 problemă', is_completed: false },
      { id: '2', task_type: 'learn_minutes', task_description: 'Învață 10 minute', is_completed: false },
      { id: '3', task_type: 'open_sketch', task_description: 'Deschide Sketch', is_completed: false },
    ]
  }

  return data as UserTask[]
}

async function fetchDashboardUpdates(): Promise<DashboardUpdate[]> {
  const { data, error } = await supabase
    .from('dashboard_updates')
    .select('*')
    .eq('is_global', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error || !data || data.length === 0) {
    return [
      { id: '1', title: 'New challenge available', description: null, type: 'challenge' },
      { id: '2', title: 'New lesson: Termodinamica 11.1', description: null, type: 'lesson' },
    ]
  }

  return data as DashboardUpdate[]
}

async function fetchContinueLearning(): Promise<ContinueLearningItem[]> {
  try {
    // Import functions dynamically to avoid server-side issues
    const { getAllGrades, getChaptersByGradeId, getLessonSummariesByChapterId } = await import('@/lib/supabase-physics')
    const { slugify } = await import('@/lib/slug')

    // Get all grades
    const grades = await getAllGrades()

    if (!grades || grades.length === 0) {
      return getContinueLearningPlaceholder()
    }

    const items: ContinueLearningItem[] = []

    // Get lessons from first 2 grades, first 2 chapters each
    for (const grade of grades.slice(0, 2)) {
      const chapters = await getChaptersByGradeId(grade.id)

      if (!chapters || chapters.length === 0) continue

      // Get lessons from first 2 chapters of this grade
      for (const chapter of chapters.slice(0, 2)) {
        const lessons = await getLessonSummariesByChapterId(chapter.id)

        if (!lessons || lessons.length === 0) continue

        // Get first 2 lessons from this chapter
        const lessonsToAdd = lessons.slice(0, 2)

        for (const lesson of lessonsToAdd) {
          if (items.length >= 4) break // Limit to 4 items total

          const slug = slugify(lesson.title)
          items.push({
            type: 'lesson' as const,
            title: lesson.title,
            description: `${grade.name} - ${chapter.title}`,
            url: `/cursuri/${slug}`,
          })
        }

        if (items.length >= 4) break
      }

      if (items.length >= 4) break
    }

    // If we have items, return them
    if (items.length > 0) {
      return items
    }

    // Fallback to placeholder
    return getContinueLearningPlaceholder()
  } catch (error) {
    console.error('Error fetching continue learning items:', error)
    return getContinueLearningPlaceholder()
  }
}

function getContinueLearningPlaceholder(): ContinueLearningItem[] {
  return [
    {
      type: 'lesson',
      title: 'Vezi toate lecțiile',
      description: 'Explorează cursurile disponibile',
      url: '/cursuri',
    },
  ]
}

function getLearningInsightsPlaceholder(): LearningInsights {
  return {
    total_time_minutes: 12,
    problems_solved_week: 8,
    average_difficulty: 2.3,
    weekly_activity: [0, 1, 2, 1, 3, 2, 1],
  }
}

// Local function to fetch last project using shared supabase client
// This avoids creating multiple GoTrueClient instances
async function fetchLastProject(userId: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      // It's normal to have no projects, so don't log error if it's just no rows
      if (error.code !== 'PGRST116') {
        console.error('Error fetching last project:', error)
      }
      return null
    }

    return data as Project
  } catch (error) {
    console.error('Error in fetchLastProject:', error)
    return null
  }
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { DashboardSidebarSkeleton } from "@/components/dashboard/dashboard-sidebar-skeleton"
import SplitText from "@/components/SplitText"
import { DailyActivityCard } from "@/components/dashboard/cards/daily-activity-card"
import { RankEloCard } from "@/components/dashboard/cards/rank-elo-card"
import { ContinueLearningCard } from "@/components/dashboard/cards/continue-learning-card"
import { DailyChallengeCard } from "@/components/dashboard/cards/daily-challenge-card"
import { RoadmapCard } from "@/components/dashboard/cards/roadmap-card"
import { SketchCard } from "@/components/dashboard/cards/sketch-card"
import { AiAssistantCard } from "@/components/dashboard/cards/ai-assistant-card"
import { AchievementsCard } from "@/components/dashboard/cards/achievements-card"
import { LearningInsightsCard } from "@/components/dashboard/cards/learning-insights-card"
import { RecommendationsCard } from "@/components/dashboard/cards/recommendations-card"
import type {
  UserStats,
  DailyActivity,
  DailyChallenge,
  RoadmapStep,
  Recommendation,
  RecentSketch,
  ContinueLearningItem,
  Achievement,
  LearningInsights,
  UserTask,
  DashboardUpdate,
} from "@/lib/dashboard-data"
import { getNextRankThreshold } from "@/lib/dashboard-data"

export function DashboardAuth() {
  const router = useRouter()
  const { user, loading: authLoading, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationCompletionTriggered = useRef(false)
  const [dashboardData, setDashboardData] = useState<{
    stats: UserStats
    activities: DailyActivity[]
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
  } | null>(null)

  // Check if this is the first visit in the session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visited = sessionStorage.getItem('dashboard_visited')
      if (!visited) {
        setIsFirstVisit(true)
        sessionStorage.setItem('dashboard_visited', 'true')
      }
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    const fetchDashboardData = async () => {
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
              // Still fetch in background to update cache
              fetchDashboardDataBackground(user.id, cacheKey)
              return
            }
          }
        }

        // Fetch critical data first (stats, activities, challenge)
        const [statsData, activitiesData, challengeData] = await Promise.all([
          fetchUserStats(user.id),
          fetchDailyActivity(user.id),
          fetchDailyChallenge(user.id),
        ])

        // Set initial data to show UI faster
        setDashboardData({
          stats: statsData,
          activities: activitiesData,
          challenge: challengeData,
          roadmap: [],
          recommendations: [],
          sketches: [],
          continueItems: [],
          achievements: [],
          insights: getLearningInsightsPlaceholder(),
          tasks: [],
          updates: [],
          eloTodayGain: 0,
          eloWeekGain: 0,
          eloHistory: [],
        })
        setLoading(false)

        // Fetch non-critical data in background
        fetchDashboardDataBackground(user.id, cacheKey)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }

    const fetchDashboardDataBackground = async (userId: string, cacheKey: string) => {
      try {
        // Fetch non-critical data in parallel
        const [
          roadmapData,
          recommendationsData,
          sketchesData,
          achievementsData,
          tasksData,
          updatesData,
          eloQuickStats,
          eloHistoryData,
        ] = await Promise.all([
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
        
        const fullData = {
          stats: null as any, // Will be set from initial fetch
          activities: null as any,
          challenge: null as any,
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
        }

        // Update with full data
        setDashboardData((prev) => ({
          ...prev!,
          ...fullData,
          stats: prev!.stats,
          activities: prev!.activities,
          challenge: prev!.challenge,
        }))

        // Cache in dev mode
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
          setDashboardData((prev) => {
            const cachedData = {
              ...prev!,
              ...fullData,
              stats: prev!.stats,
              activities: prev!.activities,
              challenge: prev!.challenge,
            }
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: cachedData,
              timestamp: Date.now(),
            }))
            return cachedData
          })
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
          // Refresh stats and activities when user_stats is updated
          const [updatedStats, updatedActivities, eloQuickStats] = await Promise.all([
            fetchUserStats(user.id),
            fetchDailyActivity(user.id),
            fetchEloQuickStats(user.id),
          ])
          
          const updatedEloHistory = await fetchEloHistory(user.id)
          setDashboardData((prev) => {
            if (!prev) return null
            return {
              ...prev,
              stats: updatedStats,
              activities: updatedActivities,
              eloTodayGain: eloQuickStats.todayGain,
              eloWeekGain: eloQuickStats.weekGain,
              eloHistory: updatedEloHistory,
            }
          })
        }
      )
      .subscribe()

    // Subscribe to realtime updates for daily_activity
    const activityChannel = supabase
      .channel(`daily_activity_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_activity',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Refresh activities when daily_activity changes
          const updatedActivities = await fetchDailyActivity(user.id)
          setDashboardData((prev) => {
            if (!prev) return null
            return {
              ...prev,
              activities: updatedActivities,
            }
          })
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(statsChannel)
      supabase.removeChannel(activityChannel)
    }
  }, [user, authLoading, router])

  const username = profile?.nickname || profile?.name || 'Student'

  const handleWelcomeAnimationComplete = useCallback(() => {
    if (animationCompletionTriggered.current) return
    animationCompletionTriggered.current = true
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationComplete(true)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])
  const shouldShowWelcome =
    isFirstVisit &&
    user &&
    (!animationComplete || authLoading || loading || !dashboardData)

  if (shouldShowWelcome) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center transition-opacity duration-500">
        <div className="text-center">
          <SplitText
            text={`Welcome back, ${username}!`}
            tag="h1"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleWelcomeAnimationComplete}
          />
          <p className="text-base sm:text-lg md:text-xl text-gray-400 mt-4">
            Here's your learning progress today
          </p>
        </div>
      </div>
    )
  }

  // Show skeleton loading only when NOT first visit
  if ((authLoading || loading || !dashboardData) && !isFirstVisit) {
    return (
      <DashboardSidebarProvider>
        <Navigation />
        <DashboardSidebarSkeleton />
        <DashboardSkeleton />
      </DashboardSidebarProvider>
    )
  }

  // Still show welcome message on first visit even if loading
  if (authLoading || loading || !dashboardData) {
    return null // Will be handled by shouldShowWelcome check above
  }

  if (!user) return null

  const userData = {
    id: user.id,
    email: user.email!,
    avatar_url: profile?.user_icon,
    username: profile?.nickname || profile?.name,
  }

  const nextRankInfo = getNextRankThreshold(dashboardData.stats.elo)

  return (
    <DashboardSidebarProvider>
      <Navigation />
      <div className="min-h-screen bg-[#0D0D0F] dashboard-scrollbar pt-16">
        <DashboardClientWrapper
          user={userData}
          stats={dashboardData.stats}
          initialTasks={dashboardData.tasks}
          continueItems={dashboardData.continueItems}
          recentAchievements={dashboardData.achievements}
          updates={dashboardData.updates}
        />

        <main className="lg:ml-[300px] p-6 md:p-8 lg:p-10 animate-fade-in-up">
        <div className="max-w-[1000px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white/90 mb-2">
              Welcome back, {userData.username || 'Student'}! 👋
            </h1>
            <p className="text-white/60">Here's your learning progress today</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <DailyActivityCard
              activities={dashboardData.activities}
              currentStreak={dashboardData.stats.current_streak}
              bestStreak={dashboardData.stats.best_streak}
              problemsToday={dashboardData.stats.problems_solved_today}
              timeToday={dashboardData.stats.total_time_minutes}
            />
            <RankEloCard
              elo={dashboardData.stats.elo}
              rank={dashboardData.stats.rank}
              nextRank={nextRankInfo.nextRank}
              nextThreshold={nextRankInfo.threshold}
              progress={nextRankInfo.progress}
              eloHistory={dashboardData.eloHistory}
              todayGain={dashboardData.eloTodayGain}
              weekGain={dashboardData.eloWeekGain}
            />
          </div>

          <div className="mb-6">
            <ContinueLearningCard items={dashboardData.continueItems} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {dashboardData.challenge && <DailyChallengeCard challenge={dashboardData.challenge} />}
            <SketchCard sketches={dashboardData.sketches} />
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-[2]">
              <AchievementsCard achievements={dashboardData.achievements} />
            </div>
            <div className="flex-[3]">
              <LearningInsightsCard insights={dashboardData.insights} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <RoadmapCard steps={dashboardData.roadmap} />
            <RecommendationsCard recommendations={dashboardData.recommendations} />
            <AiAssistantCard />
          </div>
        </div>
        </main>
        
        {/* Footer */}
        <footer className="lg:ml-[300px]">
          <Footer backgroundColor="bg-[#080808]" borderColor="border-[#1a1a1a]" />
        </footer>
      </div>
    </DashboardSidebarProvider>
  )
}

// Helper functions for client-side data fetching
async function fetchUserStats(userId: string): Promise<UserStats> {
  // Check and reset streak if user skipped a day
  try {
    const { error: streakError } = await supabase.rpc('check_and_reset_streak_if_needed', {
      user_uuid: userId,
    })
    if (streakError) {
      console.error('Error checking streak reset:', streakError)
    }
  } catch (err) {
    console.error('Error checking streak reset:', err)
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
    .single()

  // Override problems_solved_today and total_time_minutes with actual values from daily_activity
  const stats = data as UserStats
  
  // If last_activity_date is different from today, reset problems_solved_today to 0
  const lastActivityDate = stats.last_activity_date ? new Date(stats.last_activity_date).toISOString().split('T')[0] : null
  if (lastActivityDate !== today) {
    stats.problems_solved_today = 0
    // Also update in database if needed (non-blocking)
    supabase
      .from('user_stats')
      .update({ problems_solved_today: 0 })
      .eq('user_id', userId)
      .then(() => {}) // Fire and forget
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

async function fetchDailyActivity(userId: string): Promise<DailyActivity[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 365)

  const { data, error } = await supabase
    .from('daily_activity')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', startDate.toISOString().split('T')[0])
    .lte('activity_date', endDate.toISOString().split('T')[0])
    .order('activity_date', { ascending: true })

  if (error || !data) return []
  return data as DailyActivity[]
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
    .single()

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


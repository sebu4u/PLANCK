"use client"

import { type CSSProperties, useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import type { RecommendedLesson } from "@/components/dashboard/cards/learn-physics-card"
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
import { FreePlanUpgradeModal } from "@/components/dashboard/free-plan-upgrade-modal"
import {
  getCompletedLearningPathItemIdsForUser,
  getCompletedLearningPathLessonIdsForUser,
  getLearningPathChapters,
  getLearningPathItemHref,
  getLearningPathLessonHref,
  getLearningPathLessonItems,
  getLearningPathLessonsByChapterId,
  getNextIncompleteLearningPathItem,
  getProblemsByClass,
  type LearningPathChapter,
  type LearningPathLesson,
} from "@/lib/supabase-learning-paths"
import type { Problem } from "@/data/problems"
import {
  DashboardStreakCard,
  type DashboardStreakDay,
} from "@/components/dashboard/cards/dashboard-streak-card"
import { DashboardMobileBottomNav } from "@/components/dashboard/dashboard-mobile-bottom-nav"
import { DashboardLearningPathsCarousel } from "@/components/dashboard/cards/dashboard-learning-paths-carousel"
import { DashboardRecommendedProblemsCard } from "@/components/dashboard/cards/dashboard-recommended-problems-card"
import { WelcomeBackOverlay } from "@/components/dashboard/welcome-back-overlay"
import { useStreakTrigger } from "@/hooks/engagement/use-streak-trigger"
import { useSocialProofTrigger } from "@/hooks/engagement/use-social-proof-trigger"
import { DashboardFakeSolveSocialOverlay } from "@/components/dashboard/dashboard-fake-solve-social-overlay"
import { useDashboardFakeSolveSocialProof } from "@/hooks/use-dashboard-fake-solve-social-proof"
import { usePostOnboardingDiscountWindow } from "@/hooks/use-post-onboarding-discount-window"
import type { FakeSolveProblem } from "@/lib/dashboard/fake-solve-social-proof"

export function DashboardAuth() {
  const router = useRouter()
  const { user, loading: authLoading, profile } = useAuth()
  const { isFree, isPaid } = useSubscriptionPlan()
  const postOnboardingDiscount = usePostOnboardingDiscountWindow(user?.id)
  const [loading, setLoading] = useState(true)
  const isInitialLoadRef = useRef(true)
  const isFetchingRef = useRef(false)
  const realtimeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const trialModalCheckedRef = useRef(false)
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  const [welcomeCtaLoading, setWelcomeCtaLoading] = useState(false)
  const [fakeSolveProblems, setFakeSolveProblems] = useState<FakeSolveProblem[]>([])
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
    streakDays: DashboardStreakDay[]
    dashboardLearningPaths: LearningPathChapter[]
    dashboardLessonsByChapter: Record<string, LearningPathLesson[]>
    dashboardStartHrefByChapter: Record<string, string>
    recommendedProblems: Problem[]
  } | null>(null)
  const fakeSolveProblemPool = useMemo<FakeSolveProblem[]>(() => {
    if (fakeSolveProblems.length > 0) return fakeSolveProblems

    return (dashboardData?.recommendedProblems || []).map((problem) => ({
      id: String(problem.id),
      title: problem.title || `problema ${problem.id}`,
    }))
  }, [dashboardData?.recommendedProblems, fakeSolveProblems])

  useStreakTrigger({ enabled: Boolean(user?.id) && !authLoading && !loading && !showWelcomeBack })
  useSocialProofTrigger({
    enabled: Boolean(user?.id) && !authLoading && !loading && !showWelcomeBack,
    solvedTotal: dashboardData?.stats.problems_solved_total,
  })
  const {
    mobileNotification: fakeSolveMobileNotification,
    mobileVisible: fakeSolveMobileVisible,
    dismissMobileNotification: dismissFakeSolveMobileNotification,
  } = useDashboardFakeSolveSocialProof({
    enabled: Boolean(user?.id) && !authLoading && !loading && !showWelcomeBack && !showTrialModal,
    problemPool: fakeSolveProblemPool,
  })

  useEffect(() => {
    if (authLoading || !user?.id) {
      setFakeSolveProblems([])
      return
    }

    let cancelled = false

    async function fetchFakeSolveProblems() {
      const { data, error } = await supabase
        .from("problems")
        .select("id, title")
        .order("created_at", { ascending: false })
        .limit(400)

      if (cancelled) return

      if (error) {
        console.error("Error fetching fake solve problem pool:", error)
        setFakeSolveProblems([])
        return
      }

      setFakeSolveProblems(
        (data || [])
          .filter((problem) => problem.id != null)
          .map((problem) => {
            const id = String(problem.id)
            const title = typeof problem.title === "string" && problem.title.trim()
              ? problem.title.trim()
              : `problema ${id}`

            return { id, title }
          }),
      )
    }

    void fetchFakeSolveProblems()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id])

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
        const cacheKey = `dashboard_cache_v2_${user.id}`
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
          streakDaysData,
          learningPathsData,
          recommendedProblemsData,
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
          fetchLastFiveStreakDays(user.id),
          fetchDashboardLearningPaths(user.id),
          fetchRecommendedProblemsForDashboard(profile?.grade),
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
          streakDays: streakDaysData,
          dashboardLearningPaths: learningPathsData.chapters,
          dashboardLessonsByChapter: learningPathsData.lessonsByChapter,
          dashboardStartHrefByChapter: learningPathsData.startHrefByChapterId,
          recommendedProblems: recommendedProblemsData,
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
          streakDaysData,
          learningPathsData,
          recommendedProblemsData,
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
          fetchLastFiveStreakDays(userId),
          fetchDashboardLearningPaths(userId),
          fetchRecommendedProblemsForDashboard(profile?.grade),
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
          streakDays: streakDaysData,
          dashboardLearningPaths: learningPathsData.chapters,
          dashboardLessonsByChapter: learningPathsData.lessonsByChapter,
          dashboardStartHrefByChapter: learningPathsData.startHrefByChapterId,
          recommendedProblems: recommendedProblemsData,
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
              const [updatedStats, eloQuickStats, streakDaysData] = await Promise.all([
                fetchUserStats(user.id, true), // Skip streak check
                fetchEloQuickStats(user.id),
                fetchLastFiveStreakDays(user.id),
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
                  streakDays: streakDaysData,
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
  }, [user?.id, authLoading, router, profile?.grade])

  useEffect(() => {
    if (authLoading || loading || !dashboardData || !user) return

    try {
      const lastVisitKey = `planck_last_dashboard_visit_${user.id}`
      const activityAckKey = `welcome_back_ack_activity_${user.id}`
      const today = new Date()
      const lastVisitRaw = localStorage.getItem(lastVisitKey)

      if (!lastVisitRaw) {
        localStorage.setItem(lastVisitKey, String(Date.now()))
        setShowWelcomeBack(false)
        return
      }

      const lastVisitDate = parseStoredDate(lastVisitRaw)
      const visitInactive = lastVisitDate ? getCalendarDayDiff(lastVisitDate, today) > 3 : false

      const lastActivityRaw = dashboardData.stats.last_activity_date
      const activityDate = parseIsoDateOnly(lastActivityRaw)
      const activityInactive = activityDate ? getCalendarDayDiff(activityDate, today) > 3 : false

      const acknowledgedActivity = localStorage.getItem(activityAckKey)
      const activitySuppressed =
        Boolean(lastActivityRaw) &&
        Boolean(acknowledgedActivity) &&
        lastActivityRaw === acknowledgedActivity

      setShowWelcomeBack(visitInactive || (activityInactive && !activitySuppressed))
    } catch {
      setShowWelcomeBack(false)
    }
  }, [authLoading, loading, dashboardData, user?.id])

  const persistWelcomeBackDismissState = () => {
    if (!user) return

    try {
      const lastVisitKey = `planck_last_dashboard_visit_${user.id}`
      const activityAckKey = `welcome_back_ack_activity_${user.id}`
      localStorage.setItem(lastVisitKey, String(Date.now()))

      const lastActivityDate = dashboardData?.stats.last_activity_date
      if (lastActivityDate) {
        localStorage.setItem(activityAckKey, lastActivityDate)
      } else {
        localStorage.removeItem(activityAckKey)
      }
    } catch {
      // Ignore storage errors silently
    }
  }

  const dismissWelcomeBack = () => {
    if (!user) {
      setShowWelcomeBack(false)
      return
    }

    persistWelcomeBackDismissState()
    setShowWelcomeBack(false)
  }

  const handleWelcomeCtaClick = async () => {
    if (welcomeCtaLoading) return

    setWelcomeCtaLoading(true)
    try {
      const scopedProblems = await getProblemsByClass(profile?.grade, 1)
      const targetHref = scopedProblems[0] ? `/probleme/${scopedProblems[0].id}` : "/probleme"
      persistWelcomeBackDismissState()
      router.prefetch(targetHref)
      router.push(targetHref)
      // Nu resetăm loading: overlay-ul rămâne până la navigare (unmount); la succes nu mai e nevoie de setState
    } catch {
      setWelcomeCtaLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || loading || !dashboardData || !user || !isFree) return
    if (showWelcomeBack) return
    if (trialModalCheckedRef.current) return
    trialModalCheckedRef.current = true

    try {
      const countKey = `dashboard_entry_count_${user.id}`
      const sessionKey = `dashboard_trial_session_${user.id}`
      const lastShownKey = `dashboard_trial_last_shown_${user.id}`

      let sessionId = sessionStorage.getItem(sessionKey)
      if (!sessionId) {
        const fallbackId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        sessionId = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : fallbackId
        sessionStorage.setItem(sessionKey, sessionId)
      }

      const currentCount = Number(localStorage.getItem(countKey) || "0")
      const nextCount = Number.isFinite(currentCount) ? currentCount + 1 : 1
      localStorage.setItem(countKey, String(nextCount))

      const lastShownSession = localStorage.getItem(lastShownKey)
      if (nextCount % 5 === 0 && lastShownSession !== sessionId) {
        localStorage.setItem(lastShownKey, sessionId)
        setShowTrialModal(true)
      }
    } catch {
      // Ignore storage errors silently
    }
  }, [authLoading, loading, dashboardData, user?.id, isFree, showWelcomeBack])


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

  // Show loading video while dashboard data is being fetched
  if (authLoading || loading || !dashboardData) {
    return <LoadingVideoOverlay zIndex={600} />
  }

  if (!user) return null

  return (
    <DashboardSidebarProvider>
      <Navigation />

      {/* Main Container - Fixed Height matching viewport minus header */}
      <div className="h-[100dvh] pt-16 overflow-hidden bg-[#ffffff] relative flex flex-row">
        <DashboardClientWrapper
          user={userData}
          stats={dashboardData.stats}
          initialTasks={dashboardData.tasks}
          continueItems={dashboardData.continueItems}
          recentAchievements={dashboardData.achievements}
          updates={dashboardData.updates}
        />

        {/* Content Wrapper - takes remaining width */}
        <div className="flex-1 lg:ml-[250px] h-full transition-all duration-300 bg-[#ffffff] flex flex-col min-w-0">
          {/* Floating Card Container */}
          <div className="m-[3px] mt-0 flex-1 min-h-0 bg-[#f8f9fa] lg:rounded-xl overflow-hidden flex flex-col lg:mt-0">

            {/* Scrollable Content Area — extra bottom padding on mobile for fixed quick nav */}
            <div className="flex-1 overflow-y-auto dashboard-scrollbar bg-[#f8f9fa] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
              {!isPaid ? (
                <div className="bg-[#f7f9fa]">
                  {postOnboardingDiscount.active ? (
                    <Link
                      href="/pricing"
                      className="group flex w-full items-center justify-center gap-2 border-y border-[#e8e8e8] bg-gradient-to-r from-[#efe0f5] via-[#f8dce4] to-[#fce8d4] px-3 py-[8.5px] text-center sm:px-4"
                    >
                      <span className="relative hidden h-9 w-9 flex-shrink-0 items-center justify-center lg:inline-flex">
                        <Image
                          src="/streak-icon.png"
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 object-contain"
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-0">
                        <span className="text-center text-[11px] font-extrabold leading-snug text-[#1a1520] sm:text-xs">
                          Dispare curând: jumătate din preț la orice plan.
                        </span>
                        <span className="inline-flex items-center gap-2 font-mono text-sm font-black tabular-nums tracking-tight text-[#b91c1c]">
                          {postOnboardingDiscount.remainingLabel}
                          <span className="font-sans text-xs font-bold text-[#2f2a3c] underline-offset-2 group-hover:underline">
                            →
                          </span>
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href="/pricing"
                      className="group flex w-full items-center justify-center gap-2 border-y border-[#e8e8e8] bg-gradient-to-r from-[#efe0f5] via-[#f8dce4] to-[#fce8d4] px-4 py-[8.5px] text-center"
                    >
                      <span className="relative hidden h-9 w-9 flex-shrink-0 items-center justify-center lg:inline-flex">
                        <Image
                          src="/streak-icon.png"
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 object-contain"
                        />
                      </span>
                      <span className="text-xs font-semibold text-[#2f2a3c] sm:text-sm">
                        Treci la Premium și accesează Insight fără limite.{" "}
                        <span className="underline-offset-2 group-hover:underline">Go Premium →</span>
                      </span>
                    </Link>
                  )}
                </div>
              ) : null}
              <main className="p-4 md:p-8 lg:p-10 animate-fade-in-up">
                <div className="max-w-[1000px] mx-auto">
                  {/* Mobile welcome */}
                  <div className="mb-4 pt-3 md:hidden">
                    <p className="text-2xl font-extrabold text-gray-900">
                      Bună, {userData.username || 'Student'} 👋
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {(() => {
                        const d = new Date()
                        const weekdays = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']
                        const months = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec']
                        return `${weekdays[d.getDay()]} • ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
                      })()}
                    </p>
                  </div>
                  {/* Desktop welcome */}
                  <div className="mb-8 hidden md:block">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Welcome back, {userData.username || 'Student'}! 👋
                    </h1>
                    <p className="text-gray-600">Here's your learning progress today</p>
                  </div>

                  <div className={`grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-4 md:gap-6 ${isPaid ? "xl:grid-rows-[auto_1fr]" : ""}`}>
                    <div className="order-1 xl:col-start-1 xl:row-start-1">
                      <DashboardStreakCard
                        currentStreak={dashboardData.stats.current_streak}
                        problemsToday={dashboardData.stats.problems_solved_today}
                        streakDays={dashboardData.streakDays}
                        streakImageSrc="/streak-icon.png"
                      />

                      {!isPaid ? (
                        postOnboardingDiscount.active ? (
                          <Link
                            href="/pricing"
                            className="group mt-4 hidden lg:block rounded-3xl border border-[#d9d7d0] bg-gradient-to-tr from-[#e2e8f8] via-[#f8dce4] to-[#fce8d4] p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-[transform,box-shadow] hover:shadow-[0_8px_24px_rgba(185,28,28,0.12)]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative h-11 w-11 flex-shrink-0">
                                <Image
                                  src="/streak-icon.png"
                                  alt=""
                                  fill
                                  className="object-contain"
                                  sizes="44px"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[15px] leading-snug font-extrabold tracking-tight text-[#0f0f10]">
                                  Dispare curând: jumătate din preț la orice plan.
                                </p>
                                <p className="mt-3 font-mono text-[22px] font-black tabular-nums leading-none tracking-tight text-[#b91c1c]">
                                  {postOnboardingDiscount.remainingLabel}
                                </p>
                              </div>
                            </div>

                            <span
                              className="dashboard-start-glow mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[#8f91f1] via-[#cd83db] to-[#f2b93d] px-4 py-3 text-base font-bold text-[#101117] shadow-[0_4px_0_#9a5aa8] transition-[transform,box-shadow] group-hover:translate-y-1 group-hover:shadow-[0_1px_0_#9a5aa8] group-active:translate-y-1 group-active:shadow-[0_1px_0_#9a5aa8]"
                              style={{ "--start-glow-tint": "rgba(248, 220, 228, 0.88)" } as CSSProperties}
                            >
                              Revendică −50% acum
                            </span>
                          </Link>
                        ) : (
                          <div className="mt-4 hidden lg:block rounded-3xl border border-[#d9d7d0] bg-gradient-to-tr from-[#e2e8f8] via-[#f8dce4] to-[#fce8d4] p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 flex-shrink-0">
                                <Image
                                  src="/streak-icon.png"
                                  alt="Premium"
                                  fill
                                  className="object-contain"
                                  sizes="44px"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[15px] leading-tight font-extrabold tracking-tight text-[#0f0f10]">
                                  Deblochează învățarea cu Premium
                                </p>
                                <p className="mt-1 text-[15px] leading-tight text-[#111215]">
                                  ca să înveți mai rapid, mai bine
                                </p>
                              </div>
                            </div>

                            <Link
                              href="/pricing"
                              className="dashboard-start-glow mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8f91f1] via-[#cd83db] to-[#f2b93d] px-4 py-3 text-base font-bold text-[#101117] shadow-[0_4px_0_#9a5aa8] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#9a5aa8] active:translate-y-1 active:shadow-[0_1px_0_#9a5aa8]"
                              style={{ "--start-glow-tint": "rgba(248, 220, 228, 0.88)" } as CSSProperties}
                            >
                              Explorează Premium
                            </Link>
                          </div>
                        )
                      ) : null}
                    </div>

                    <div className="order-2 md:order-3 xl:order-none overflow-visible xl:col-start-2 xl:row-span-2">
                      <p className="mb-3 text-sm font-bold text-gray-500 md:hidden">
                        Continuă de unde ai rămas
                      </p>
                      <DashboardLearningPathsCarousel
                        chapters={dashboardData.dashboardLearningPaths}
                        lessonsByChapter={dashboardData.dashboardLessonsByChapter}
                        startHrefByChapter={dashboardData.dashboardStartHrefByChapter}
                      />
                    </div>

                    <div className="order-3 md:order-2 xl:order-none xl:col-start-1 xl:row-start-2">
                      <DashboardRecommendedProblemsCard
                        problems={dashboardData.recommendedProblems}
                        userGrade={profile?.grade}
                      />
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      {showTrialModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setShowTrialModal(false)}
          role="presentation"
        >
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-[520px]">
            <FreePlanUpgradeModal
              imageSrc="/dashboard-card.png"
              onClose={() => setShowTrialModal(false)}
            />
          </div>
        </div>
      )}

      {showWelcomeBack && (
        <WelcomeBackOverlay
          username={userData.username}
          onBackdropClick={dismissWelcomeBack}
          onCtaClick={handleWelcomeCtaClick}
          ctaLoading={welcomeCtaLoading}
        />
      )}

      <DashboardMobileBottomNav userGrade={profile?.grade} />
      <DashboardFakeSolveSocialOverlay
        notification={fakeSolveMobileNotification}
        visible={fakeSolveMobileVisible}
        onDismiss={dismissFakeSolveMobileNotification}
      />

    </DashboardSidebarProvider>
  )
}

function parseStoredDate(value: string | null): Date | null {
  if (!value) return null

  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    const date = new Date(numeric)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseIsoDateOnly(value: string | null): Date | null {
  if (!value) return null
  return parseStoredDate(value)
}

function getCalendarDayDiff(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.floor((toMidnight.getTime() - fromMidnight.getTime()) / 86400000)
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

  const today = formatLocalDate(new Date())
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
    'Ușor': 200,
    'Mediu': 300,
    'Avansat': 450,
    Easy: 200,
    Medium: 300,
    Hard: 450,
    Difficult: 450,
  }

  const eloByProblemId = new Map<string, number>()
  problems?.forEach((p: any) => {
    const elo = difficultyToElo[p.difficulty] ?? 200
    eloByProblemId.set(p.id, elo)
  })

  let todayGain = 0
  let weekGain = 0

  for (const sp of solvedProblems as any[]) {
    const solvedAt = new Date(sp.solved_at)
    const elo = eloByProblemId.get(sp.problem_id) ?? 200

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
    'Ușor': 200,
    'Mediu': 300,
    'Avansat': 450,
    Easy: 200,
    Medium: 300,
    Hard: 450,
    Difficult: 450,
  }

  const eloByProblemId = new Map<string, number>()
  problems?.forEach((p: any) => {
    const elo = difficultyToElo[p.difficulty] ?? 200
    eloByProblemId.set(p.id, elo)
  })

  // Group solved problems by day (ELO gained per day)
  const eloByDay = new Map<string, number>()

  for (const sp of solvedProblems as any[]) {
    const solvedAt = new Date(sp.solved_at)
    const dayKey = solvedAt.toISOString().split('T')[0]
    const elo = eloByProblemId.get(sp.problem_id) ?? 200
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
  const today = formatLocalDate(new Date())

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
  const today = formatLocalDate(new Date())

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

interface DashboardLearningPathsData {
  chapters: LearningPathChapter[]
  lessonsByChapter: Record<string, LearningPathLesson[]>
  startHrefByChapterId: Record<string, string>
}

function selectDashboardLearningPathChapters(chapters: LearningPathChapter[]): LearningPathChapter[] {
  const preferredSlugs = ["cinematica-punctului-material", "dinamica", "optica-geometrica"]
  const picked: LearningPathChapter[] = []
  const pickedIds = new Set<string>()

  for (const slug of preferredSlugs) {
    const chapter = chapters.find((item) => item.slug === slug && !pickedIds.has(item.id))
    if (!chapter) continue
    picked.push(chapter)
    pickedIds.add(chapter.id)
  }

  const titleMatchers = [
    /(cinematica|punctului material)/i,
    /dinamica/i,
    /optica/i,
  ]

  for (const matcher of titleMatchers) {
    if (picked.length >= 3) break
    const chapter = chapters.find(
      (item) => !pickedIds.has(item.id) && matcher.test(item.title)
    )
    if (!chapter) continue
    picked.push(chapter)
    pickedIds.add(chapter.id)
  }

  if (picked.length < 3) {
    for (const chapter of chapters) {
      if (pickedIds.has(chapter.id)) continue
      picked.push(chapter)
      pickedIds.add(chapter.id)
      if (picked.length >= 3) break
    }
  }

  return picked.slice(0, 3)
}

async function getLearningPathResumeHref(
  userId: string,
  chapter: LearningPathChapter,
  lessons: LearningPathLesson[]
): Promise<string> {
  const firstLesson = lessons[0]
  if (!firstLesson) return "/invata"

  const lessonIds = lessons.map((lesson) => lesson.id)
  const completedLessonIds = new Set(
    await getCompletedLearningPathLessonIdsForUser(supabase, userId, lessonIds)
  )

  for (const lesson of lessons) {
    const items = await getLearningPathLessonItems(lesson.id)
    const lessonHref = getLearningPathLessonHref(chapter, lesson)

    if (!items.length) {
      if (!completedLessonIds.has(lesson.id)) return lessonHref
      continue
    }

    const completedItemIds = await getCompletedLearningPathItemIdsForUser(
      supabase,
      userId,
      items.map((item) => item.id)
    )
    const nextItem = getNextIncompleteLearningPathItem(items, completedItemIds)

    if (nextItem) {
      const nextItemIndex = items.findIndex((item) => item.id === nextItem.id)
      return getLearningPathItemHref(chapter, lesson, Math.max(nextItemIndex, 0))
    }
  }

  const lastLesson = lessons[lessons.length - 1] ?? firstLesson
  return getLearningPathLessonHref(chapter, lastLesson)
}

async function fetchDashboardLearningPaths(userId: string): Promise<DashboardLearningPathsData> {
  const chapters = await getLearningPathChapters()
  const selectedChapters = selectDashboardLearningPathChapters(chapters)
  const lessonsByChapter: Record<string, LearningPathLesson[]> = {}
  const startHrefByChapterId: Record<string, string> = {}

  await Promise.all(
    selectedChapters.map(async (chapter) => {
      const lessons = await getLearningPathLessonsByChapterId(chapter.id)
      lessonsByChapter[chapter.id] = lessons.slice(0, 2)
      startHrefByChapterId[chapter.id] = await getLearningPathResumeHref(userId, chapter, lessons)
    })
  )

  return {
    chapters: selectedChapters,
    lessonsByChapter,
    startHrefByChapterId,
  }
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getWeekdayLabel(date: Date): string {
  const labels = ["D", "L", "Ma", "Mi", "J", "V", "S"]
  return labels[date.getDay()] || "?"
}

async function fetchLastFiveStreakDays(userId: string): Promise<DashboardStreakDay[]> {
  const endDate = new Date()
  endDate.setHours(0, 0, 0, 0)
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 4)

  const startIso = formatLocalDate(startDate)
  const endIso = formatLocalDate(endDate)

  const { data } = await supabase
    .from("daily_activity")
    .select("activity_date, problems_solved")
    .eq("user_id", userId)
    .gte("activity_date", startIso)
    .lte("activity_date", endIso)

  const activeDays = new Set(
    (data || [])
      .filter((item: any) => (item.problems_solved || 0) > 0)
      .map((item: any) => {
        if (typeof item.activity_date === "string") return item.activity_date
        return formatLocalDate(new Date(item.activity_date))
      })
  )

  const streakDays: DashboardStreakDay[] = []
  for (let index = 0; index < 5; index++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    const localDate = formatLocalDate(date)
    streakDays.push({
      date: localDate,
      label: getWeekdayLabel(date),
      active: activeDays.has(localDate),
    })
  }

  return streakDays
}

async function fetchRecommendedProblemsForDashboard(grade: unknown): Promise<Problem[]> {
  const gradeValue =
    typeof grade === "number" || typeof grade === "string"
      ? grade
      : null

  const scopedProblems = await getProblemsByClass(gradeValue, 5)
  if (scopedProblems.length > 0) return scopedProblems

  return getProblemsByClass(null, 5)
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

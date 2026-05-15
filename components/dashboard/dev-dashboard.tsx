"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useAdmin } from "@/hooks/use-admin"
import { Navigation } from "@/components/navigation"
import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { DashboardMobileBottomNav } from "@/components/dashboard/dashboard-mobile-bottom-nav"
import type {
  Achievement,
  ContinueLearningItem,
  DashboardUpdate,
  UserStats,
  UserTask,
} from "@/lib/dashboard-data"

/** Valori neutre — secțiunea „Today” e ascunsă în sidebar pentru dev. */
const DEV_SIDEBAR_PLACEHOLDER_STATS: UserStats = {
  elo: 0,
  rank: "—",
  current_streak: 0,
  best_streak: 0,
  total_time_minutes: 0,
  problems_solved_today: 0,
  problems_solved_total: 0,
  last_activity_date: null,
}

const EMPTY_TASKS: UserTask[] = []
const EMPTY_CONTINUE: ContinueLearningItem[] = []
const EMPTY_ACHIEVEMENTS: Achievement[] = []
const EMPTY_UPDATES: DashboardUpdate[] = []

export function DevDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, profile } = useAuth()
  const { isAdmin } = useAdmin()

  const env = process.env.NODE_ENV

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/")
    }
  }, [authLoading, user, router])

  const userData = useMemo(() => {
    if (!user) {
      return {
        id: "",
        email: "",
        avatar_url: undefined,
        username: undefined,
      }
    }
    return {
      id: user.id,
      email: user.email ?? "",
      avatar_url: profile?.user_icon,
      username: profile?.nickname || profile?.name,
    }
  }, [user?.id, user?.email, profile?.user_icon, profile?.nickname, profile?.name])

  if (authLoading || !user) {
    return <LoadingVideoOverlay zIndex={600} />
  }

  return (
    <DashboardSidebarProvider>
      <Navigation />

      <div className="relative flex h-[100dvh] flex-row overflow-hidden bg-[#ffffff] pt-16">
        <DashboardClientWrapper
          user={userData}
          stats={DEV_SIDEBAR_PLACEHOLDER_STATS}
          initialTasks={EMPTY_TASKS}
          continueItems={EMPTY_CONTINUE}
          recentAchievements={EMPTY_ACHIEVEMENTS}
          updates={EMPTY_UPDATES}
          dashboardHomeHref="/dashboard/dev"
          sidebarVariant="dev"
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ffffff] transition-all duration-300 lg:ml-[250px]">
          <div className="m-[3px] mt-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f9fa] lg:mt-0 lg:rounded-xl">
            <div className="dashboard-scrollbar flex-1 overflow-y-auto bg-[#f8f9fa] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
              <main className="animate-fade-in-up p-4 md:p-8 lg:p-10">
                <div className="mx-auto max-w-[1000px]">
                  <div className="mb-4 pt-3 md:hidden">
                    <p className="text-2xl font-extrabold text-gray-900">
                      Bună, {userData.username || "Dev"} 👋
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {(() => {
                        const d = new Date()
                        const weekdays = [
                          "Duminică",
                          "Luni",
                          "Marți",
                          "Miercuri",
                          "Joi",
                          "Vineri",
                          "Sâmbătă",
                        ]
                        const months = [
                          "ian",
                          "feb",
                          "mar",
                          "apr",
                          "mai",
                          "iun",
                          "iul",
                          "aug",
                          "sep",
                          "oct",
                          "nov",
                          "dec",
                        ]
                        return `${weekdays[d.getDay()]} • ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
                      })()}
                    </p>
                    <p className="mt-2 text-xs font-medium text-amber-800/90">
                      Mod dev — fără carduri de progres pentru studenți.
                    </p>
                  </div>

                  <div className="mb-8 hidden md:block">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, {userData.username || "Dev"}! 👋
                      </h1>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                        {env}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      Mod dev — același layout ca dashboard-ul principal, fără carduri pentru userii
                      obișnuiți.
                    </p>
                  </div>

                  <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-5 md:p-6">
                    <p className="mb-4 text-sm text-gray-600">
                      Linkuri rapide (nu sunt carduri de streak, premium, trasee sau recomandări).
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href="/probleme"
                        className="rounded-xl border border-gray-200 bg-[#f8f9fa] px-4 py-4 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
                      >
                        Probleme
                      </Link>
                      <Link
                        href="/cursuri"
                        className="rounded-xl border border-gray-200 bg-[#f8f9fa] px-4 py-4 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
                      >
                        Cursuri
                      </Link>
                      {isAdmin ? (
                        <Link
                          href="/admin/lessons"
                          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm font-semibold text-violet-950 transition hover:border-violet-300 hover:bg-violet-100 sm:col-span-2"
                        >
                          Admin — Lecții
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      <DashboardMobileBottomNav userGrade={profile?.grade} />
    </DashboardSidebarProvider>
  )
}

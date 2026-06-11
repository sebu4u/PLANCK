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
import type { DevSubjectKey } from "@/lib/dev-subjects"
const DEV_SUBJECT_CARDS: {
  key: DevSubjectKey
  title: string
  className: string
  href?: string
}[] = [
  {
    key: "matematica",
    title: "Matematică",
    className: "border-sky-200 bg-sky-50/80 text-sky-950",
    href: "/dashboard/dev/catalog/matematica",
  },
  {
    key: "informatica",
    title: "Informatică",
    className: "border-indigo-200 bg-indigo-50/80 text-indigo-950",
    href: "/dashboard/dev/catalog/informatica",
  },
  {
    key: "ai",
    title: "AI",
    className: "border-violet-200 bg-violet-50/80 text-violet-950",
    href: "/dashboard/dev/catalog/ai",
  },
  {
    key: "fizica",
    title: "Fizică",
    className: "border-amber-200 bg-amber-50/80 text-amber-950",
    href: "/dashboard/dev/catalog/fizica",
  },
  {
    key: "biologie",
    title: "Biologie",
    className: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
    href: "/dashboard/dev/catalog/biologie",
  },
]

export function DevDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, profile, devSubjects, isSuperDev } = useAuth()
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

  const visibleSubjectCards = useMemo(() => {
    if (isAdmin || isSuperDev) return DEV_SUBJECT_CARDS
    return DEV_SUBJECT_CARDS.filter((card) => devSubjects?.includes(card.key))
  }, [devSubjects, isAdmin, isSuperDev])

  if (authLoading || !user) {
    return <LoadingVideoOverlay zIndex={600} />
  }

  return (
    <DashboardSidebarProvider>
      <Navigation />

      <div className="relative flex h-[100dvh] flex-row overflow-hidden bg-[#ffffff] pt-16">
        <DashboardClientWrapper
          user={userData}
          dashboardHomeHref="/dashboard/dev"
          sidebarVariant="dev"
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ffffff] transition-all duration-300">
          <div className="m-[3px] mt-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-[#ffffff] lg:mt-0 lg:rounded-xl">
            <div className="dashboard-scrollbar flex-1 overflow-y-auto bg-[#ffffff]">
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
                      Mod dev — vezi doar materiile la care ai acces.
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
                      Mod dev — deschide o materie pentru catalog sau learning path. Vezi doar conținutul tău.
                    </p>
                  </div>

                  <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-5 md:p-6">
                    <div className="grid grid-cols-2 gap-3">
                      {visibleSubjectCards.map((card) => {
                        const cls = `flex min-h-[100px] flex-col justify-end rounded-xl border px-4 py-4 shadow-sm transition hover:opacity-95 ${card.className}`
                        const inner = <p className="text-base font-bold tracking-tight">{card.title}</p>
                        return card.href ? (
                          <Link key={card.title} href={card.href} className={cls}>
                            {inner}
                          </Link>
                        ) : (
                          <div key={card.title} className={`${cls} cursor-default opacity-90`}>
                            {inner}
                          </div>
                        )
                      })}
                    </div>
                    {isAdmin ? (
                      <Link
                        href="/admin/lessons"
                        className="mt-4 block rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-center text-sm font-semibold text-violet-950 transition hover:border-violet-300 hover:bg-violet-100"
                      >
                        Admin — Lecții
                      </Link>
                    ) : null}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

    </DashboardSidebarProvider>
  )
}

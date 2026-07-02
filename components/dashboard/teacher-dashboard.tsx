"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap, Plus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ClassroomsSidebarNav } from "@/components/classrooms/classrooms-sidebar-nav"
import { Navigation } from "@/components/navigation"
import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { ClassActivityDonutCard } from "@/components/dashboard/teacher/class-activity-donut-card"
import { HomeworkReviewCard } from "@/components/dashboard/teacher/homework-review-card"
import { TeacherCourseCard } from "@/components/dashboard/teacher/teacher-course-card"
import { TestsReviewCard } from "@/components/dashboard/teacher/tests-review-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  TeacherClassroomOverview,
  TeacherPendingHomeworkReview,
} from "@/lib/teacher/server"

function EloDistribution({ students }: { students: TeacherClassroomOverview["students"] }) {
  const maxElo = Math.max(500, ...students.map((student) => student.elo))

  if (students.length === 0) {
    return <p className="text-sm text-[#6b7280]">Niciun elev în clasă.</p>
  }

  return (
    <div className="space-y-2">
      {students.slice(0, 8).map((student) => {
        const width = Math.max(8, Math.round((student.elo / maxElo) * 100))
        return (
          <div key={student.user_id} className="grid grid-cols-[120px_1fr_48px] items-center gap-3">
            <span className="truncate text-sm text-[#374151]">{student.name}</span>
            <div className="h-2 rounded-full bg-[#eceff3]">
              <div className="h-2 rounded-full bg-[#1a73e8]" style={{ width: `${width}%` }} />
            </div>
            <span className="text-right text-xs font-medium text-[#111827]">{student.elo}</span>
          </div>
        )
      })}
    </div>
  )
}

function ClassroomOverviewCard({ overview }: { overview: TeacherClassroomOverview }) {
  const { classroom, students, class_stats: stats } = overview

  return (
    <Card className="border-[#eceff3]">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">{classroom.name}</CardTitle>
          <CardDescription>
            Cod clasă: <span className="font-mono font-semibold">{classroom.join_code}</span>
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/classrooms/${classroom.id}`}>Deschide clasa</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[#f8f8fb] p-3">
            <p className="text-xs text-[#6b7280]">Elevi</p>
            <p className="mt-1 text-sm font-semibold">{stats.student_count}</p>
          </div>
          <div className="rounded-xl bg-[#f8f8fb] p-3">
            <p className="text-xs text-[#6b7280]">ELO mediu</p>
            <p className="mt-1 text-sm font-semibold">{stats.avg_elo}</p>
          </div>
          <div className="rounded-xl bg-[#f8f8fb] p-3">
            <p className="text-xs text-[#6b7280]">Activi (7 zile)</p>
            <p className="mt-1 text-sm font-semibold">{stats.active_last_7_days}</p>
          </div>
          <div className="rounded-xl bg-[#f8f8fb] p-3">
            <p className="text-xs text-[#6b7280]">Probleme totale</p>
            <p className="mt-1 text-sm font-semibold">{stats.total_problems_solved}</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-[#111827]">Distribuție ELO</p>
          <EloDistribution students={students} />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-[#111827]">Elevi</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#eceff3] text-[#6b7280]">
                  <th className="py-2 pr-4 font-medium">Nume</th>
                  <th className="py-2 pr-4 font-medium">ELO</th>
                  <th className="py-2 pr-4 font-medium">Streak</th>
                  <th className="py-2 pr-4 font-medium">Min (30z)</th>
                  <th className="py-2 font-medium">Ultima activitate</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-[#6b7280]">
                      Niciun elev înscris încă.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.user_id} className="border-b border-[#f3f4f6]">
                      <td className="py-2 pr-4 font-medium text-[#111827]">{student.name}</td>
                      <td className="py-2 pr-4">{student.elo}</td>
                      <td className="py-2 pr-4">{student.current_streak}</td>
                      <td className="py-2 pr-4">{student.activity_minutes_30d}</td>
                      <td className="py-2">{student.last_activity_date ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TeacherDashboardProps {
  initialOverview: TeacherClassroomOverview[]
  initialPendingHomework: TeacherPendingHomeworkReview[]
  initialPendingHomeworkTotal: number
}

export function TeacherDashboard({
  initialOverview,
  initialPendingHomework,
  initialPendingHomeworkTotal,
}: TeacherDashboardProps) {
  const router = useRouter()
  const { user, loading: authLoading, profile, isTeacher } = useAuth()
  const [overview] = useState(initialOverview)

  const teacherName = profile?.nickname?.trim() || profile?.name?.trim() || "profesor"
  const classrooms = useMemo(() => overview.map((item) => item.classroom), [overview])

  const userData = useMemo(
    () => ({
      id: user?.id ?? "",
      email: user?.email ?? "",
      avatar_url: profile?.user_icon,
      username: profile?.nickname || profile?.name,
    }),
    [user?.id, user?.email, profile?.user_icon, profile?.nickname, profile?.name],
  )

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/")
      return
    }
    if (!isTeacher) {
      router.replace("/dashboard")
    }
  }, [authLoading, user, isTeacher, router])

  if (authLoading) {
    return <LoadingVideoOverlay />
  }

  return (
    <DashboardSidebarProvider>
      <Navigation />

      <div className="relative flex h-[100dvh] w-full min-w-0 flex-row overflow-hidden bg-[#ffffff] pt-16">
        <DashboardClientWrapper user={userData} dashboardHomeHref="/dashboard/teacher" />

        <aside className="hidden min-h-0 w-[250px] shrink-0 flex-col border-r border-[#e8e8e8] bg-white/95 px-4 py-6 lg:flex">
          <ClassroomsSidebarNav classrooms={classrooms} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ffffff] transition-all duration-300">
          <div className="dashboard-scrollbar flex-1 overflow-y-auto bg-[#ffffff]">
            <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#111827]">
                    Bună, {teacherName}! <span aria-hidden="true">👋</span>
                  </h1>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Gestionează clasele și urmărește progresul elevilor.
                    {profile?.teaching_materie ? ` · ${profile.teaching_materie}` : ""}
                  </p>
                </div>
                <Button asChild>
                  <Link href="/classrooms/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Clasă nouă
                  </Link>
                </Button>
              </div>

              {overview.length === 0 ? (
                <Card className="border-dashed border-[#d1d5db]">
                  <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                    <GraduationCap className="h-10 w-10 text-[#9ca3af]" />
                    <p className="text-base font-medium text-[#111827]">Nu ai clase create încă</p>
                    <p className="max-w-md text-sm text-[#6b7280]">
                      Creează prima clasă și invită elevii cu codul de join.
                    </p>
                    <Button asChild>
                      <Link href="/classrooms/new">Creează o clasă</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[2fr_1fr]">
                    <TeacherCourseCard />
                    <ClassActivityDonutCard overview={overview} />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <HomeworkReviewCard
                      initialItems={initialPendingHomework}
                      initialTotalCount={initialPendingHomeworkTotal}
                    />
                    <TestsReviewCard />
                  </div>

                  <div className="space-y-4">
                    {overview.map((item) => (
                      <ClassroomOverviewCard key={item.classroom.id} overview={item} />
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </DashboardSidebarProvider>
  )
}

import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { AnnouncementPost } from "@/components/classrooms/announcement-post"
import { AssignmentStreamPost } from "@/components/classrooms/assignment-stream-post"
import { ClassroomFeedSkeleton } from "@/components/classrooms/classroom-skeletons"
import type { Problem } from "@/data/problems"
import {
  getClassroomAnnouncements,
  getClassroomAssignments,
  getClassroomDetailsForUser,
  getLessonOptionsForAnnouncements,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation"
import { createClient } from "@supabase/supabase-js"

const AnnouncementComposer = dynamic(
  () => import("@/components/classrooms/announcement-composer").then((module) => module.AnnouncementComposer),
  {
    loading: () => (
      <div className="rounded-xl border border-[#eceff3] bg-white p-4">
        <div className="h-5 w-52 animate-pulse rounded-md bg-[#e5e7eb]" />
        <div className="mt-4 h-20 w-full animate-pulse rounded-xl bg-[#e5e7eb]" />
      </div>
    ),
  },
)

const ClassroomStreamGate = dynamic(
  () => import("@/components/classrooms/classroom-stream-gate").then((module) => module.ClassroomStreamGate),
  {
    loading: () => <ClassroomFeedSkeleton />,
  },
)

const errorMessages: Record<string, string> = {
  file_upload_failed: "Fișierul nu a putut fi încărcat. Încearcă din nou.",
  announcement_failed: "Nu am putut publica anunțul. Verifică toate câmpurile.",
  teacher_only: "Doar profesorul clasei poate publica anunțuri.",
}

export default async function ClassroomStreamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const { id } = await params
  const classroom = await getClassroomDetailsForUser(id, user.id)
  if (!classroom) {
    redirect("/classrooms")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const serverSupabase = createClient(supabaseUrl, supabaseAnonKey)

  const [announcements, assignments, lessons, query, initialProblems, monthlyFreeSet] = await Promise.all([
    getClassroomAnnouncements(id),
    getClassroomAssignments(id),
    classroom.role === "teacher" ? getLessonOptionsForAnnouncements() : Promise.resolve([]),
    searchParams,
    classroom.role === "teacher"
      ? serverSupabase
          .from("problems")
          .select("*")
          .order("created_at", { ascending: false })
          .then(({ data }) => ((data || []) as Problem[]))
      : Promise.resolve([] as Problem[]),
    classroom.role === "teacher" ? getMonthlyFreeProblemSet(serverSupabase) : Promise.resolve(new Set<string>()),
  ])

  const errorMessage = query.error ? errorMessages[query.error] : undefined
  const now = Date.now()

  /** Toate temele apar în feed, inclusiv după deadline (marcate vizual în `AssignmentStreamPost`). */
  const feedItems = [
    ...announcements.map((announcement) => ({
      kind: "announcement" as const,
      createdAt: announcement.created_at,
      id: announcement.id,
      announcement,
    })),
    ...assignments.map((assignment) => ({
      kind: "assignment" as const,
      createdAt: assignment.created_at,
      id: assignment.id,
      assignment,
    })),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

  const nextDeadlines = assignments
    .filter((assignment) => assignment.deadline && new Date(assignment.deadline).getTime() > now)
    .sort((left, right) => new Date(left.deadline ?? 0).getTime() - new Date(right.deadline ?? 0).getTime())
    .slice(0, 4)

  return (
    <ClassroomStreamGate
      classroomId={id}
      isTeacher={classroom.role === "teacher"}
      initialProblems={initialProblems}
      initialMonthlyFreeSet={Array.from(monthlyFreeSet)}
    >
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-xl border border-[#dadce0] bg-white p-4">
          <h2 className="text-sm font-semibold text-[#202124]">Urmează</h2>
          {nextDeadlines.length === 0 ? (
            <p className="mt-3 text-xs text-[#5f6368]">Nimic de predat curând.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {nextDeadlines.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-[#e8eaed] p-2">
                  <p className="line-clamp-1 text-sm font-medium text-[#1f1f1f]">{assignment.title}</p>
                  <p className="mt-1 text-xs text-[#5f6368]">
                    {assignment.deadline
                      ? new Date(assignment.deadline).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })
                      : "Fără termen limită"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="space-y-4">
          {classroom.role === "teacher" ? (
            <AnnouncementComposer classroomId={id} lessons={lessons} />
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-3">
            {feedItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white p-8 text-center text-sm text-[#6b7280]">
                Încă nu există postări.
              </div>
            ) : (
              feedItems.map((item) =>
                item.kind === "announcement" ? (
                  <AnnouncementPost key={`ann-${item.id}`} announcement={item.announcement} deadline={null} />
                ) : (
                  <AssignmentStreamPost key={`asg-${item.id}`} classroomId={id} assignment={item.assignment} />
                ),
              )
            )}
          </div>
        </div>
      </div>
    </ClassroomStreamGate>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useFormStatus } from "react-dom"
import { ArrowLeft, Bell, CalendarDays, CirclePlus, Home, Loader2, NotebookPen } from "lucide-react"
import { createAssignmentAction } from "@/app/classrooms/actions"
import { useClassroomAssignmentDraft } from "@/components/classrooms/classroom-assignment-draft-context"
import { ClassroomsListFab } from "@/components/classrooms/classrooms-list-fab"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { ClassroomSummary } from "@/lib/classrooms/types"

interface ClassroomsShellProps {
  children: ReactNode
  classrooms: ClassroomSummary[]
}

function formatDeadline(deadline: string) {
  if (!deadline) return "Fără termen limită"

  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return "Fără termen limită"
  return date.toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })
}

function DraftSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#111827] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#030712] transition-[transform,box-shadow,opacity] hover:translate-y-1 hover:shadow-[0_1px_0_#030712]",
        (disabled || pending) && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-[0_4px_0_#030712]",
      )}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Se postează...
        </>
      ) : (
        "Postează tema"
      )}
    </button>
  )
}

function DraftSubmitForm({
  classroomId,
  title,
  description,
  deadline,
  selectedProblemIds,
}: {
  classroomId: string
  title: string
  description: string
  deadline: string
  selectedProblemIds: string[]
}) {
  const disabled = !title.trim() || selectedProblemIds.length === 0

  return (
    <form action={createAssignmentAction} className="w-full">
      <input type="hidden" name="classroom_id" value={classroomId} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="deadline" value={deadline} />
      {selectedProblemIds.map((problemId) => (
        <input key={problemId} type="hidden" name="problem_ids" value={problemId} />
      ))}
      <DraftSubmitButton disabled={disabled} />
    </form>
  )
}

/** ID clasă din URL (`/classrooms/[id]/...`), exclus `new` / `join`. */
function classroomIdFromPathname(pathname: string | null): string | null {
  if (!pathname) return null
  const m = pathname.match(/^\/classrooms\/([^/]+)/)
  if (!m) return null
  const id = m[1]
  if (id === "new" || id === "join") return null
  return id
}

function ClassroomSidebarCard({
  classroom,
  isActive,
}: {
  classroom: ClassroomSummary
  isActive: boolean
}) {
  const cover = classroom.cover_image
    ? { backgroundImage: `url(${classroom.cover_image})` }
    : { background: "linear-gradient(135deg, #1a73e8, #174ea6 60%, #0b57d0)" }

  return (
    <Link
      href={`/classrooms/${classroom.id}`}
      className={cn(
        "group flex w-full min-h-[56px] overflow-hidden rounded-xl border transition-all",
        isActive
          ? "border-[#c7d2fe] bg-[#eef2ff] shadow-sm"
          : "border-[#e8e8e8] bg-[#ffffff] hover:border-[#d1d5db] hover:shadow-sm"
      )}
    >
      <div className="relative w-[40%] min-w-[72px] shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={cover} />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent to-[#ffffff]",
            isActive ? "via-[#eef2ff]/70 to-[#eef2ff]" : "via-[#ffffff]/60 to-[#ffffff]"
          )}
          aria-hidden
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2">
        <span
          className={cn(
            "line-clamp-2 text-left text-sm font-semibold leading-snug",
            isActive ? "text-[#1e3a8a]" : "text-[#111827] group-hover:text-[#0f172a]"
          )}
        >
          {classroom.name}
        </span>
      </div>
    </Link>
  )
}

export function ClassroomsShell({ children, classrooms }: ClassroomsShellProps) {
  const pathname = usePathname()
  const isClassroomsHome = pathname === "/classrooms" || pathname === "/classrooms/"

  const pathClassId = classroomIdFromPathname(pathname)
  const {
    addProblem,
    cancelPicking,
    draft,
    isPickingForClassroom,
    isProblemSelected,
    selectedCount,
    selectedProblemIds,
  } = useClassroomAssignmentDraft()
  const streamClassId = pathClassId ?? classrooms[0]?.id ?? null
  const noutatiHref = streamClassId ? `/classrooms/${streamClassId}` : "/classrooms"
  const noutatiActive = streamClassId != null && pathname === `/classrooms/${streamClassId}`
  const acasaActive = pathname === "/classrooms" || pathname === "/classrooms/"
  const activeClassroom = classrooms.find((classroom) => classroom.id === pathClassId) ?? null

  const classroomProblemPreviewMatch = pathname?.match(/^\/classrooms\/([^/]+)\/probleme\/([^/]+)/)
  const previewProblemIdFromPath = classroomProblemPreviewMatch?.[2] ?? null

  const isOnClassroomProblemPreview =
    pathClassId != null &&
    previewProblemIdFromPath != null &&
    isPickingForClassroom(pathClassId) &&
    Boolean(pathname?.startsWith(`/classrooms/${pathClassId}/probleme/`))

  const isDraftPicking =
    pathClassId != null &&
    isPickingForClassroom(pathClassId) &&
    (pathname === `/classrooms/${pathClassId}` ||
      Boolean(pathname?.startsWith(`/classrooms/${pathClassId}/probleme/`)))

  return (
    <div className="relative flex h-[100dvh] w-full min-w-0 overflow-hidden bg-[#ffffff] pt-16">
      {pathClassId && !isDraftPicking ? (
        <Link
          href="/classrooms"
          className={cn(
            "fixed right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-[#e5e7eb] bg-white/95 text-[#111827] shadow-md backdrop-blur-sm transition hover:bg-white active:scale-[0.98]",
            "top-[calc(4rem+0.75rem+env(safe-area-inset-top,0px))] lg:hidden"
          )}
          aria-label="Înapoi la clase"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
        </Link>
      ) : null}

      {isDraftPicking && !isOnClassroomProblemPreview ? (
        <button
          type="button"
          onClick={cancelPicking}
          className="fixed right-4 top-[calc(4rem+0.75rem+env(safe-area-inset-top,0px))] z-[110] inline-flex rounded-full border border-[#e5e7eb] bg-white/95 px-4 py-2 text-sm font-semibold text-[#111827] shadow-md backdrop-blur-sm transition hover:bg-white lg:hidden"
        >
          Anulează
        </button>
      ) : null}

      <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-[#e8e8e8] bg-white/95 px-4 py-6 min-h-0">
        {isDraftPicking && pathClassId ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto pr-1 dashboard-scrollbar">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                  Draft temă
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#111827]">{draft.title}</h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Alege problemele din catalog, apoi postează tema direct din acest panou.
                </p>
              </div>

              {activeClassroom ? (
                <div className="rounded-2xl border border-[#e8eaed] bg-[#f8fafc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Clasă</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{activeClassroom.name}</p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[#e8eaed] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[#111827]">
                  <NotebookPen className="h-4 w-4" aria-hidden />
                  <p className="text-sm font-semibold">Detalii temă</p>
                </div>
                {draft.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">{draft.description}</p>
                ) : (
                  <p className="mt-3 text-sm text-[#9ca3af]">Nu ai adăugat încă o descriere.</p>
                )}
                <div className="mt-4 rounded-xl border border-[#eef2f7] bg-[#f8fafc] px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    Termen limită
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">{formatDeadline(draft.deadline)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#dbe5f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7280]">Selecție</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[#111827]">{selectedCount}</p>
                <p className="mt-1 text-sm text-[#4b5563]">
                  {selectedCount === 1 ? "problemă adăugată în temă" : "probleme adăugate în temă"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-[#ececec] pt-4">
              {isOnClassroomProblemPreview && pathClassId ? (
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 w-full rounded-full text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]"
                >
                  <Link href={`/classrooms/${pathClassId}`}>Înapoi la selectarea problemelor</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelPicking}
                  className="h-11 w-full rounded-full text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]"
                >
                  Înapoi
                </Button>
              )}
              <DraftSubmitForm
                classroomId={pathClassId}
                title={draft.title}
                description={draft.description}
                deadline={draft.deadline}
                selectedProblemIds={selectedProblemIds}
              />
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 dashboard-scrollbar">
            <Link
              href="/classrooms"
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                acasaActive
                  ? "bg-[#f4f5f7] text-[#111827]"
                  : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]"
              )}
            >
              <Home className="h-4 w-4 shrink-0" aria-hidden />
              Acasă
            </Link>

            <Link
              href={noutatiHref}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                noutatiActive
                  ? "bg-[#f4f5f7] text-[#111827]"
                  : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]"
              )}
            >
              <Bell className="h-4 w-4 shrink-0" aria-hidden />
              Noutăți
            </Link>

            {classrooms.length > 0 ? (
              <div className="space-y-2 pt-4 border-t border-[#ececec]">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                  Clasele mele
                </p>
                {classrooms.map((classroom) => {
                  const base = `/classrooms/${classroom.id}`
                  const isActive = pathname === base || Boolean(pathname?.startsWith(`${base}/`))
                  return (
                    <ClassroomSidebarCard key={classroom.id} classroom={classroom} isActive={isActive} />
                  )
                })}
              </div>
            ) : null}

            <div className={cn(classrooms.length > 0 ? "pt-4 border-t border-[#ececec]" : "pt-2")}>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start gap-2 rounded-xl border-[#e8e8e8] px-3 py-2 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]"
                  >
                    <CirclePlus className="h-4 w-4 shrink-0" aria-hidden />
                    Adaugă clasă
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>Adaugă clasă</SheetTitle>
                    <SheetDescription>
                      Creează o clasă nouă sau intră într-una cu un cod.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-2">
                    <SheetClose asChild>
                      <Button asChild className="h-11 w-full justify-start font-medium" variant="ghost">
                        <Link href="/classrooms/new">Creează o clasă</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="h-11 w-full justify-start font-medium" variant="ghost">
                        <Link href="/classrooms/join">Intră într-o clasă</Link>
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col bg-[#ffffff]">
        <div className="m-[3px] mt-0 flex-1 min-h-0 bg-[#f8f9fa] lg:rounded-xl overflow-hidden flex flex-col">
          <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fa] dashboard-scrollbar">
            <main
              className={cn(
                "p-4 md:p-8 lg:p-10",
                isDraftPicking && "lg:p-0 lg:pb-0",
                isDraftPicking && !isOnClassroomProblemPreview && "pb-32",
                isDraftPicking && isOnClassroomProblemPreview && "pb-40 lg:pb-0",
              )}
            >
              <div className={cn("mx-auto w-full max-w-5xl", isDraftPicking && "max-w-none")}>{children}</div>
            </main>
          </div>
        </div>
      </div>

      {isDraftPicking && pathClassId ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] border-t border-[#dbe5f0] bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:hidden">
          <div className="pointer-events-auto mx-auto max-w-5xl">
            {isOnClassroomProblemPreview && previewProblemIdFromPath ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => addProblem(previewProblemIdFromPath)}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-3 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505]",
                    isProblemSelected(previewProblemIdFromPath) && "bg-emerald-700 shadow-none hover:translate-y-0",
                  )}
                >
                  {isProblemSelected(previewProblemIdFromPath) ? "Problemă adăugată la temă" : "Adaugă la temă"}
                </button>
                <Button asChild variant="outline" className="h-11 w-full rounded-full text-sm font-semibold">
                  <Link href={`/classrooms/${pathClassId}`}>Înapoi la selectarea problemelor</Link>
                </Button>
              </div>
            ) : (
              <DraftSubmitForm
                classroomId={pathClassId}
                title={draft.title}
                description={draft.description}
                deadline={draft.deadline}
                selectedProblemIds={selectedProblemIds}
              />
            )}
          </div>
        </div>
      ) : null}

      {isClassroomsHome ? <ClassroomsListFab /> : null}
    </div>
  )
}

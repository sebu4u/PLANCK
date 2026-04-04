"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { Bell, CirclePlus, Home } from "lucide-react"
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
  const streamClassId = pathClassId ?? classrooms[0]?.id ?? null
  const noutatiHref = streamClassId ? `/classrooms/${streamClassId}` : "/classrooms"
  const noutatiActive =
    streamClassId != null && pathname === `/classrooms/${streamClassId}`
  const acasaActive = pathname === "/classrooms" || pathname === "/classrooms/"

  return (
    <div className="h-[100dvh] pt-16 overflow-hidden bg-[#ffffff] relative flex">
      <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-[#e8e8e8] bg-white/95 px-4 py-6 min-h-0">
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
      </aside>

      <div className="flex-1 min-w-0 flex flex-col bg-[#ffffff]">
        <div className="m-[3px] mt-0 flex-1 min-h-0 bg-[#f8f9fa] lg:rounded-xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto dashboard-scrollbar bg-[#f8f9fa]">
            <main className="p-4 md:p-8 lg:p-10">
              <div className="mx-auto w-full max-w-5xl">{children}</div>
            </main>
          </div>
        </div>
      </div>

      {isClassroomsHome ? <ClassroomsListFab /> : null}
    </div>
  )
}

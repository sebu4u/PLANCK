import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ClassroomCard } from "@/components/classrooms/classroom-card"
import { cn } from "@/lib/utils"
import { getClassroomsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { normalizeUserType } from "@/lib/user-types"

const EMPTY_CLASSROOMS_IMAGE_SRC = `/images/icons/${encodeURIComponent("Untitled design (48).webp")}`

const errorMessages: Record<string, string> = {
  invalid_leave_request: "Nu am putut procesa cererea de ieșire. Încearcă din nou.",
  not_member: "Nu mai ești membru al acelei clase.",
  teacher_cannot_leave: "Titularul nu poate părăsi propria clasă.",
  teacher_account_required: "Doar un cont de profesor poate crea o clasă.",
}

export default async function ClassroomsHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; left?: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const admin = createAdminClient()
  const [{ data: profile }, classrooms, query] = await Promise.all([
    admin.from("profiles").select("user_type").eq("user_id", user.id).maybeSingle(),
    getClassroomsForUser(user.id, { includeArchived: true }),
    searchParams,
  ])
  const canCreateClassroom = normalizeUserType(profile?.user_type) === "profesor"
  const errorMessage = query.error ? errorMessages[query.error] : undefined
  const leftMessage = query.left === "1" ? "Ai părăsit clasa." : undefined
  const activeClassrooms = classrooms.filter((classroom) => !classroom.archived_at)
  const archivedClassrooms = classrooms.filter((classroom) => Boolean(classroom.archived_at))
  const hasNoClassrooms = activeClassrooms.length === 0 && archivedClassrooms.length === 0

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex flex-wrap items-end justify-between gap-4",
          hasNoClassrooms && "hidden md:flex"
        )}
      >
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Clase</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Gestionează clasele, temele și anunțurile într-un singur loc.
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <Button asChild variant="outline">
            <Link href="/classrooms/join">Intră într-o clasă</Link>
          </Button>
          {canCreateClassroom ? (
            <Button asChild>
              <Link href="/classrooms/new">Creează o clasă</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {leftMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {leftMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {hasNoClassrooms ? (
        <div className="flex min-h-[min(58dvh,26rem)] w-full flex-col items-center justify-center px-4 py-8 text-center md:min-h-[min(48dvh,20rem)] md:py-12">
          <div className="flex w-full max-w-sm flex-col items-center justify-center gap-5">
            <Image
              src={EMPTY_CLASSROOMS_IMAGE_SRC}
              alt=""
              width={120}
              height={120}
              className="mx-auto h-auto w-[min(120px,38vw)] shrink-0 select-none object-contain"
              priority
            />
            <p className="mx-auto max-w-md text-center text-base leading-relaxed text-[#374151]">
              Se pare că nu ești în nicio clasă încă..
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeClassrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      )}
      {archivedClassrooms.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#6b7280]">Clase arhivate</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {archivedClassrooms.map((classroom) => (
              <ClassroomCard key={classroom.id} classroom={classroom} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

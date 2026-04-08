import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ClassroomCard } from "@/components/classrooms/classroom-card"
import { cn } from "@/lib/utils"
import { getClassroomsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"

const EMPTY_CLASSROOMS_IMAGE_SRC = `/images/icons/${encodeURIComponent("Untitled design (48).png")}`

const errorMessages: Record<string, string> = {
  invalid_leave_request: "Could not process the leave request. Please try again.",
  not_member: "You are no longer a member of that classroom.",
  teacher_cannot_leave: "Teachers cannot leave their own classroom.",
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

  const [classrooms, query] = await Promise.all([getClassroomsForUser(user.id), searchParams])
  const errorMessage = query.error ? errorMessages[query.error] : undefined
  const leftMessage = query.left === "1" ? "You left the classroom." : undefined
  const hasNoClassrooms = classrooms.length === 0

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex flex-wrap items-end justify-between gap-4",
          hasNoClassrooms && "hidden md:flex"
        )}
      >
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Classrooms</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Manage your classes, assignments, and announcements in one place.
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <Button asChild variant="outline">
            <Link href="/classrooms/join">Join classroom</Link>
          </Button>
          <Button asChild>
            <Link href="/classrooms/new">Create classroom</Link>
          </Button>
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
          {classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      )}
    </div>
  )
}

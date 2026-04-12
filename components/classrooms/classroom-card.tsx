import Link from "next/link"
import { Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ClassroomCardActions } from "@/components/classrooms/classroom-card-actions"
import type { ClassroomSummary } from "@/lib/classrooms/types"

interface ClassroomCardProps {
  classroom: ClassroomSummary
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
  const initial = classroom.name.trim().charAt(0).toUpperCase() || "C"

  return (
    <Card className="relative h-full overflow-visible border-[#dadce0] bg-white transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/classrooms/${classroom.id}`}
        className="relative block min-h-[150px] overflow-hidden rounded-t-xl px-5 py-4 text-white"
        style={{
          backgroundImage: classroom.cover_image
            ? `linear-gradient(0deg, rgba(32, 33, 36, 0.2), rgba(32, 33, 36, 0.2)), url(${classroom.cover_image})`
            : "linear-gradient(135deg, #1a73e8, #174ea6 60%, #0b57d0)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />
        <div className="relative z-10">
          <h3 className="line-clamp-2 text-2xl font-semibold tracking-tight">{classroom.name}</h3>
          <p className="mt-1 text-sm font-medium text-white/90">Creată de {classroom.teacher_name}</p>
        </div>
      </Link>

      <div className="absolute right-4 top-[118px] z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#5c6bc0] text-3xl font-medium text-white shadow-md">
        {initial}
      </div>

      <CardContent className="flex min-h-[130px] items-end justify-between px-4 py-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Cod: {classroom.join_code}</p>
          <p className="inline-flex items-center gap-1.5 text-sm text-[#5f6368]">
            <Users className="h-4 w-4" />
            {classroom.student_count} membri
          </p>
          <p className="text-xs text-[#80868b]">
            {new Date(classroom.created_at).toLocaleDateString("ro-RO")}
          </p>
        </div>

        <div className="pb-1">
          <ClassroomCardActions classroomId={classroom.id} isTeacher={classroom.role === "teacher"} />
        </div>
      </CardContent>
    </Card>
  )
}

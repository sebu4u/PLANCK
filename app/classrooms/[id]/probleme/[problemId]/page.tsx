import { notFound, redirect } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import ProblemDetailClient from "@/app/probleme/[id]/ProblemDetailClient"
import { Problem } from "@/data/problems"
import { getClassroomDetailsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"

const categoryIcons = {
  Mecanică: "🚀",
  Termodinamică: "🔥",
  Electricitate: "⚡",
  Optică: "🌟",
}

const difficultyColors = {
  Ușor: "border-green-500 text-green-600 bg-green-50",
  Mediu: "border-yellow-500 text-yellow-600 bg-yellow-50",
  Avansat: "border-red-500 text-red-600 bg-red-50",
}

async function getProblemFromSupabase(id: string): Promise<Problem | null> {
  const { data, error } = await supabase.from("problems").select("*").eq("id", id).single()
  if (error || !data) return null
  return data as Problem
}

export default async function ClassroomProblemStatementPage({
  params,
}: {
  params: Promise<{ id: string; problemId: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const { id: classroomId, problemId } = await params
  const classroom = await getClassroomDetailsForUser(classroomId, user.id)
  if (!classroom || classroom.role !== "teacher") {
    redirect("/classrooms")
  }

  const problem = await getProblemFromSupabase(problemId)
  if (!problem) {
    notFound()
  }

  return (
    <div className="bg-[#f6f5f4]">
      <ProblemDetailClient
        problem={problem}
        categoryIcons={categoryIcons}
        difficultyColors={difficultyColors}
        embedVariant="classroomAssignment"
        classroomCatalogHref={`/classrooms/${classroomId}`}
      />
    </div>
  )
}

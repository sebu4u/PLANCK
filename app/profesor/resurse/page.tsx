import type { Metadata } from "next"
import { ResursePredareHub } from "@/components/profesor/resurse-predare-hub"
import { fetchExerseazaCounts } from "@/lib/exerseaza-counts"
import { requireTeacherUser } from "@/lib/teacher/require-teacher"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Resurse de predare"),
  description: "Materiale pentru profesori: exerciții, grile, cursuri și trasee de învățare.",
}

export const dynamic = "force-dynamic"

export default async function ProfesorResursePage() {
  await requireTeacherUser()
  const counts = await fetchExerseazaCounts()

  return <ResursePredareHub counts={counts} />
}

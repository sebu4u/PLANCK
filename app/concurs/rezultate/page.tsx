import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"

import { ConcursNavbar } from "@/components/concurs/concurs-navbar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

type GradeKey = "IX" | "X" | "XI" | "XII"

type ContestResultRow = {
  id: string
  grade: GradeKey
  position: number
  student_name: string
  school: string
  score: number
  prize: string
}

const gradeSections: Array<{ key: GradeKey; title: string }> = [
  { key: "IX", title: "Clasa a IX-a" },
  { key: "X", title: "Clasa a X-a" },
  { key: "XI", title: "Clasa a XI-a" },
  { key: "XII", title: "Clasa a XII-a" }
]

export const metadata: Metadata = {
  title: "Rezultate Concurs PLANCK",
  description: "Rezultatele oficiale ale Concursului Național de Fizică PLANCK, organizate pe clasele IX-XII."
}

async function getContestResults(): Promise<ContestResultRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("contest_results")
    .select("id, grade, position, student_name, school, score, prize")
    .order("grade", { ascending: true })
    .order("position", { ascending: true })
    .order("student_name", { ascending: true })

  if (error) {
    console.error("Contest results fetch error:", error)
    return []
  }

  return (data ?? []) as ContestResultRow[]
}

export default async function ConcursRezultatePage() {
  const results = await getContestResults()

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ConcursNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-8 lg:px-16">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
              <Trophy className="h-8 w-8 text-orange-500" />
              Rezultate Concurs PLANCK
            </h1>
            <p className="mt-3 text-gray-600">
              Clasament oficial pe fiecare clasă: IX, X, XI și XII.
            </p>
          </div>

          <Link href="/concurs">
            <Button variant="outline" className="gap-2 rounded-full">
              <ArrowLeft className="h-4 w-4" />
              Înapoi la concurs
            </Button>
          </Link>
        </div>

        <div className="space-y-10">
          {gradeSections.map((section) => {
            const classRows = results.filter((row) => row.grade === section.key)

            return (
              <section key={section.key} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>

                {classRows.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-gray-600 sm:px-6">
                    Nu există rezultate publicate momentan pentru această clasă.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Nr.</TableHead>
                        <TableHead>Nume</TableHead>
                        <TableHead>Școală</TableHead>
                        <TableHead className="w-[140px]">Punctaj</TableHead>
                        <TableHead className="w-[180px]">Premiu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classRows.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.position ?? index + 1}</TableCell>
                          <TableCell>{row.student_name}</TableCell>
                          <TableCell>{row.school}</TableCell>
                          <TableCell>{row.score}</TableCell>
                          <TableCell>{row.prize}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}

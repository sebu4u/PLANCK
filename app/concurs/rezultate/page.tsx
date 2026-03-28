import { Metadata } from "next"
import { ConcursRezultateClientShell } from "@/components/concurs/concurs-rezultate-client-shell"
import { createClient } from "@/lib/supabase/server"
import { ContestResultRow, RezultatePublicContent } from "./rezultate-public-content"

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
    <ConcursRezultateClientShell>
      <RezultatePublicContent results={results} />
    </ConcursRezultateClientShell>
  )
}

import { Metadata } from "next"
import { ConcursRezultateClientShell } from "@/components/concurs/concurs-rezultate-client-shell"
import { createClient } from "@supabase/supabase-js"
import { ContestResultRow, RezultatePublicContent } from "./rezultate-public-content"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Rezultate concurs"),
  description: "Rezultatele oficiale ale Concursului Național de Fizică PLANCK, organizate pe clasele IX-XII."
}

export const revalidate = 3600

async function getContestResults(): Promise<ContestResultRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase
    .from("contest_results")
    .select("id, grade, position, student_name, school, score, prize")
    .order("grade", { ascending: true })
    .order("position", { ascending: true })
    .order("student_name", { ascending: true })
    .limit(500)

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

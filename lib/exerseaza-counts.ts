import { createClient } from "@supabase/supabase-js"

export interface ExerseazaCounts {
  exercises: number
  grile: number
}

export async function fetchExerseazaCounts(): Promise<ExerseazaCounts> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { exercises: 0, grile: 0 }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const [physicsRes, mathRes, informaticaRes, grileRes] = await Promise.all([
      supabase.from("problems").select("id", { count: "exact", head: true }),
      supabase
        .from("math_problems")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("coding_problems")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("quiz_questions").select("id", { count: "exact", head: true }),
    ])

    const exercises =
      (physicsRes.count ?? 0) + (mathRes.count ?? 0) + (informaticaRes.count ?? 0)
    const grile = grileRes.count ?? 0

    return { exercises, grile }
  } catch {
    return { exercises: 0, grile: 0 }
  }
}

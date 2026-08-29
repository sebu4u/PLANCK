import { createClient } from "@supabase/supabase-js"
import type { PracticeSubjectId } from "@/lib/practice-subject"

export interface ExerseazaCounts {
  exercises: number
  grile: number
  teste: number
}

export type ExerseazaCountsBySubject = Record<PracticeSubjectId, ExerseazaCounts>

const EMPTY_COUNTS: ExerseazaCounts = { exercises: 0, grile: 0, teste: 0 }

export const EMPTY_EXERSEAZA_COUNTS_BY_SUBJECT: ExerseazaCountsBySubject = {
  fizica: EMPTY_COUNTS,
  matematica: EMPTY_COUNTS,
  informatica: EMPTY_COUNTS,
}

export async function fetchExerseazaCountsBySubject(): Promise<ExerseazaCountsBySubject> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return EMPTY_EXERSEAZA_COUNTS_BY_SUBJECT
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const [
      physicsRes,
      mathRes,
      informaticaRes,
      grileFizicaRes,
      testeFizicaRes,
      testeMateRes,
      testeInfoRes,
    ] = await Promise.all([
      supabase.from("problems").select("id", { count: "exact", head: true }),
      supabase
        .from("math_problems")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("coding_problems")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .or("materie.eq.fizica,materie.is.null"),
      supabase
        .from("practice_tests")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("subject", "fizica"),
      supabase
        .from("practice_tests")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("subject", "matematica"),
      supabase
        .from("practice_tests")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("subject", "informatica"),
    ])

    return {
      fizica: {
        exercises: physicsRes.count ?? 0,
        grile: grileFizicaRes.count ?? 0,
        teste: testeFizicaRes.count ?? 0,
      },
      matematica: {
        exercises: mathRes.count ?? 0,
        grile: 0,
        teste: testeMateRes.count ?? 0,
      },
      informatica: {
        exercises: informaticaRes.count ?? 0,
        grile: 0,
        teste: testeInfoRes.count ?? 0,
      },
    }
  } catch {
    return EMPTY_EXERSEAZA_COUNTS_BY_SUBJECT
  }
}

export async function fetchExerseazaCounts(): Promise<ExerseazaCounts> {
  const bySubject = await fetchExerseazaCountsBySubject()
  return {
    exercises:
      bySubject.fizica.exercises +
      bySubject.matematica.exercises +
      bySubject.informatica.exercises,
    grile: bySubject.fizica.grile + bySubject.matematica.grile + bySubject.informatica.grile,
    teste: bySubject.fizica.teste + bySubject.matematica.teste + bySubject.informatica.teste,
  }
}

"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarClock, Hourglass, Rocket, TriangleAlert } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { ContestInterface } from "@/components/concurs/contest-interface"
import { ContestTimer } from "@/components/concurs/contest-timer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ContestProblem, ContestStatus, ContestSubmission, ContestSummary } from "@/lib/contest-utils"
import { supabase } from "@/lib/supabaseClient"

type PageState =
  | { type: "loading" }
  | { type: "none" }
  | { type: "error"; message: string }
  | { type: "not_started"; contest: ContestSummary; remainingSeconds: number }
  | { type: "ended"; contest: ContestSummary | null }
  | {
      type: "active"
      contest: ContestSummary
      grade: string
      contestCode?: string
      problems: ContestProblem[]
      submissions: ContestSubmission[]
      remainingSeconds: number
    }

function ContestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Rocket className="h-6 w-6" />
            <span>PLANCK</span>
          </Link>

          <Link
            href="/concurs"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la pagina concursului
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

export default function ContestExamPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const [pageState, setPageState] = useState<PageState>({ type: "loading" })

  const loadContestData = useCallback(async () => {
    if (!user) {
      return
    }

    setPageState({ type: "loading" })

    try {
      const activeResponse = await fetch("/api/contest/active", { cache: "no-store" })
      const activeData = await activeResponse.json()

      if (!activeResponse.ok) {
        throw new Error(activeData.error || "Nu am putut încărca informațiile despre concurs.")
      }

      const status = activeData.status as ContestStatus
      const contest = (activeData.contest as ContestSummary | null) ?? null

      if (status === "none" || !contest) {
        setPageState({ type: "none" })
        return
      }

      if (status === "not_started") {
        setPageState({
          type: "not_started",
          contest,
          remainingSeconds: activeData.remaining_seconds ?? 0
        })
        return
      }

      if (status === "ended") {
        setPageState({
          type: "ended",
          contest
        })
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        router.push("/login?returnUrl=/concurs/proba")
        return
      }

      const problemsResponse = await fetch("/api/contest/problems", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      const problemsData = await problemsResponse.json()

      if (problemsResponse.status === 403 && problemsData.code === "NOT_REGISTERED") {
        router.push("/concurs/inscriere")
        return
      }

      if (problemsResponse.status === 409 && problemsData.contest_status === "not_started") {
        setPageState({
          type: "not_started",
          contest: problemsData.contest as ContestSummary,
          remainingSeconds: problemsData.remaining_seconds ?? 0
        })
        return
      }

      if (problemsResponse.status === 409 && problemsData.contest_status === "ended") {
        setPageState({
          type: "ended",
          contest: (problemsData.contest as ContestSummary | null) ?? contest
        })
        return
      }

      if (problemsResponse.status === 404 && problemsData.code === "NO_CONTEST") {
        setPageState({ type: "none" })
        return
      }

      if (!problemsResponse.ok) {
        throw new Error(problemsData.error || "Nu am putut încărca subiectele.")
      }

      setPageState({
        type: "active",
        contest: problemsData.contest as ContestSummary,
        grade: problemsData.grade as string,
        contestCode: problemsData.contest_code as string | undefined,
        problems: (problemsData.problems as ContestProblem[]) ?? [],
        submissions: (problemsData.submissions as ContestSubmission[]) ?? [],
        remainingSeconds: problemsData.remaining_seconds ?? 0
      })
    } catch (error) {
      setPageState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "A apărut o eroare neașteptată la încărcarea concursului."
      })
    }
  }, [router, user])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.push("/login?returnUrl=/concurs/proba")
      return
    }

    void loadContestData()
  }, [authLoading, loadContestData, router, user])

  useEffect(() => {
    if (pageState.type === "error") {
      toast({
        title: "Nu am putut încărca concursul",
        description: pageState.message,
        variant: "destructive"
      })
    }
  }, [pageState, toast])

  if (authLoading || pageState.type === "loading") {
    return (
      <ContestShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" />
            <p className="text-sm text-gray-500">Se încarcă sesiunea de concurs...</p>
          </div>
        </div>
      </ContestShell>
    )
  }

  if (pageState.type === "active") {
    return (
      <ContestShell>
        <ContestInterface
          contest={pageState.contest}
          grade={pageState.grade}
          contestCode={pageState.contestCode}
          initialProblems={pageState.problems}
          initialSubmissions={pageState.submissions}
          initialRemainingSeconds={pageState.remainingSeconds}
        />
      </ContestShell>
    )
  }

  if (pageState.type === "not_started") {
    return (
      <ContestShell>
        <Card className="mx-auto max-w-3xl rounded-[2rem] border-orange-200 shadow-sm">
          <CardContent className="space-y-8 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <CalendarClock className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">{pageState.contest.name}</h1>
              <p className="text-lg text-gray-600">
                Concursul nu a început încă. Cronometrul de mai jos folosește timpul serverului.
              </p>
            </div>

            <div className="flex justify-center">
              <ContestTimer
                initialSeconds={pageState.remainingSeconds}
                label="Până la start"
                onExpire={() => void loadContestData()}
              />
            </div>

            <p className="text-sm text-gray-500">
              După start, pagina se va putea reîncărca automat sau poți apăsa butonul de mai jos.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => void loadContestData()}
                className="h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
              >
                Verifică din nou
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl">
                <Link href="/concurs/inscriere">Vezi înscrierea</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ContestShell>
    )
  }

  if (pageState.type === "ended") {
    return (
      <ContestShell>
        <Card className="mx-auto max-w-3xl rounded-[2rem] border-red-200 shadow-sm">
          <CardContent className="space-y-6 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Hourglass className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Timpul de concurs a expirat</h1>
              <p className="text-lg text-gray-600">
                {pageState.contest
                  ? `Perioada pentru ${pageState.contest.name} s-a încheiat și nu mai pot fi trimise răspunsuri.`
                  : "Perioada de concurs s-a încheiat și nu mai pot fi trimise răspunsuri."}
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800">
                <Link href="/concurs">Înapoi la concurs</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl">
                <Link href="/profil">Mergi în profil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ContestShell>
    )
  }

  if (pageState.type === "none") {
    return (
      <ContestShell>
        <Card className="mx-auto max-w-3xl rounded-[2rem] border-gray-200 shadow-sm">
          <CardContent className="space-y-6 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <TriangleAlert className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Niciun concurs configurat</h1>
              <p className="text-lg text-gray-600">
                În momentul de față nu există un concurs PLANCK programat în platformă.
              </p>
            </div>

            <Button asChild className="h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800">
              <Link href="/concurs">Înapoi la pagina concursului</Link>
            </Button>
          </CardContent>
        </Card>
      </ContestShell>
    )
  }

  return (
    <ContestShell>
      <Card className="mx-auto max-w-3xl rounded-[2rem] border-gray-200 shadow-sm">
        <CardContent className="space-y-6 p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <TriangleAlert className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">Eroare la încărcare</h1>
            <p className="text-lg text-gray-600">{pageState.message}</p>
          </div>

          <Button onClick={() => void loadContestData()} className="h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800">
            Încearcă din nou
          </Button>
        </CardContent>
      </Card>
    </ContestShell>
  )
}

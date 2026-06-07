"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ListChecks, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CodingSubmitResponse } from "./types"

type ResultView = "summary" | "tests"

interface CodingSubmitResultOverlayProps {
  open: boolean
  loading: boolean
  error: string | null
  result: CodingSubmitResponse | null
  onClose: () => void
  /** După o soluție acceptată, navighează la itemul următor (ex. learning path). */
  onAcceptedContinue?: () => Promise<void> | void
}

function statusLabel(status: string): string {
  switch (status) {
    case "accepted":
      return "Acceptat"
    case "partial":
      return "Parțial"
    case "wrong_answer":
      return "Răspuns greșit"
    case "compile_error":
      return "Eroare compilare"
    case "runtime_error":
      return "Eroare la rulare"
    case "time_limit_exceeded":
      return "Time limit"
    case "memory_limit_exceeded":
      return "Memorie depășită"
    case "internal_error":
      return "Eroare internă"
    default:
      return status
  }
}

export function CodingSubmitResultOverlay({
  open,
  loading,
  error,
  result,
  onClose,
  onAcceptedContinue,
}: CodingSubmitResultOverlayProps) {
  const [view, setView] = useState<ResultView>("summary")
  const [displayElo, setDisplayElo] = useState(500)

  useEffect(() => {
    if (!open) setView("summary")
  }, [open])

  const elo = result?.elo ?? null

  useEffect(() => {
    if (!open || loading || !result || !elo) return

    const prev = elo.previousElo
    const next = elo.newElo
    setDisplayElo(prev)

    let frame = 0
    const start = performance.now()
    const duration = 850
    const delta = next - prev

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayElo(Math.round(prev + delta * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open, loading, result, elo])

  if (!open) return null

  const delta = elo?.delta ?? 0
  const eloPositive = delta > 0
  const eloNegative = delta < 0

  const shellClass =
    eloPositive
      ? "border-emerald-200 bg-white shadow-[0_24px_70px_rgba(20,83,45,0.22)]"
      : eloNegative
        ? "border-rose-200 bg-white shadow-[0_24px_70px_rgba(190,18,60,0.18)]"
        : "border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]"

  const headlineClass = eloPositive ? "text-emerald-600" : eloNegative ? "text-rose-600" : "text-slate-600"

  const eloPanelClass = eloPositive
    ? "bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fffb_100%)]"
    : eloNegative
      ? "bg-[linear-gradient(180deg,#fff1f2_0%,#fffbfb_100%)]"
      : "bg-[linear-gradient(180deg,#f1f5f9_0%,#f8fafc_100%)]"

  const eloNumberClass = eloPositive ? "text-emerald-700" : eloNegative ? "text-rose-700" : "text-slate-700"

  const handleSummaryContinue = async () => {
    const shouldNavigate = result?.status === "accepted" && onAcceptedContinue
    onClose()
    if (shouldNavigate) {
      await onAcceptedContinue()
    }
  }

  return (
    <div className="fixed inset-0 z-[460] flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
      <div
        key={loading ? "loading" : result ? result.submissionId : error ? "err" : "idle"}
        className={`w-full animate-in rounded-[28px] border p-6 text-center fade-in zoom-in-95 duration-300 ${view === "tests" ? "max-w-lg" : "max-w-sm"} ${shellClass}`}
      >
        {loading ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Evaluare oficială</p>
            <div className="mt-8 flex flex-col items-center gap-4 py-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold text-[#374151]">Se rulează testele pe server…</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-6 w-full rounded-full border-slate-300"
              onClick={onClose}
            >
              Anulează
            </Button>
          </>
        ) : error ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Evaluare</p>
            <h2 className="mt-3 text-xl font-black tracking-tight text-[#111111]">Nu s-a putut evalua</h2>
            <p className="mt-4 text-left text-sm font-medium leading-relaxed text-rose-800/90 whitespace-pre-wrap">
              {error}
            </p>
            <Button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-slate-900 px-5 py-3 text-base font-bold text-white hover:bg-slate-800"
            >
              Închide
            </Button>
          </>
        ) : result && view === "summary" ? (
          <>
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${headlineClass}`}>Rezultat evaluare</p>
            <h2 className="mt-2 text-4xl font-black tabular-nums tracking-tight text-[#111111]">
              {result.scorePercent}%
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#5f6f67]">
              {result.passedTests}/{result.totalTests} teste reușite · {statusLabel(result.status)}
            </p>

            {elo ? (
              <div className={`mt-5 rounded-2xl px-5 py-6 ${eloPanelClass}`}>
                <p className="text-sm font-semibold text-[#5f6f67]">ELO-ul tău</p>
                <p className={`mt-2 text-5xl font-black tabular-nums ${eloNumberClass}`}>{displayElo}</p>
                <p className={`mt-2 text-sm font-semibold ${eloPositive ? "text-emerald-600" : eloNegative ? "text-rose-600" : "text-slate-600"}`}>
                  {delta > 0 ? `+${delta} ELO` : delta < 0 ? `${delta} ELO` : "Fără schimbare ELO la acest pas"}
                  <span className="block font-normal text-[#5f6f67]">
                    {elo.previousElo} → {elo.newElo}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-[#64748b]">
                    Cel mai bun scor pe problemă: {elo.newBest}%
                  </span>
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#64748b]">ELO indisponibil pentru acest răspuns.</p>
            )}

            {result.eloError ? (
              <p className="mt-3 text-xs font-medium text-rose-600">ELO: {result.eloError}</p>
            ) : null}

            <div className="mt-6 flex flex-col gap-2">
              {(result.tests ?? []).length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("tests")}
                  className="w-full rounded-full border-slate-300 py-3 text-base font-bold text-[#111111] hover:bg-slate-50"
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Vezi rezultatul pe fiecare test
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={() => void handleSummaryContinue()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_2px_0_#047857]"
              >
                Continuă
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : result && view === "tests" ? (
          <>
            <button
              type="button"
              onClick={() => setView("summary")}
              className="mx-auto mb-4 flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Înapoi la rezumat
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Teste</p>
            <h2 className="mt-2 text-lg font-black text-[#111111]">
              {result.scorePercent}% · {result.passedTests}/{result.totalTests}
            </h2>
            <div className="mt-4 max-h-[min(52vh,420px)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 text-left">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur">
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-2 font-bold">#</th>
                    <th className="px-3 py-2 font-bold">Test</th>
                    <th className="px-3 py-2 font-bold">Rezultat</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.tests ?? []).map((t) => (
                    <tr key={t.testId} className="border-b border-slate-200/80 align-top">
                      <td className="px-3 py-2 font-mono text-slate-600">{t.orderIndex}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-slate-700">{t.isSample ? "Exemplu" : "Ascuns"}</span>
                        {t.isSample && (t.stdin != null || t.stdout != null) ? (
                          <div className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono text-[0.65rem] leading-snug text-slate-500">
                            {t.stdin != null ? <>in: {t.stdin}</> : null}
                            {t.stdout != null ? (
                              <>
                                {t.stdin != null ? "\n" : null}
                                out: {t.stdout}
                              </>
                            ) : null}
                            {t.stderr ? (
                              <>
                                {"\n"}
                                <span className="text-rose-600">err: {t.stderr}</span>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <span className={t.passed ? "font-bold text-emerald-700" : "font-bold text-rose-600"}>
                          {t.passed ? "OK" : t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_#047857] hover:bg-emerald-700"
            >
              Închide
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

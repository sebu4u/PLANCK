"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

type WorkshopInfo = {
  title: string
  starts_at: string
  subject: string
  teacher_name: string | null
}

export default function PregatireInscrisPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [workshop, setWorkshop] = useState<WorkshopInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const ok = searchParams.get("ok") === "1"
  const error = searchParams.get("error")

  useEffect(() => {
    if (!ok || !params.id) {
      setLoading(false)
      return
    }

    let cancelled = false
    async function loadWorkshop() {
      try {
        const { data } = await supabase
          .from("workshops")
          .select(`
            title,
            starts_at,
            subject,
            teacher:workshop_teachers(name)
          `)
          .eq("id", params.id)
          .maybeSingle()

        if (!cancelled && data) {
          setWorkshop({
            title: data.title,
            starts_at: data.starts_at,
            subject: data.subject,
            teacher_name: data.teacher ? (data.teacher as { name: string }).name : null,
          })
        }
      } catch {
        // Workshop details optional - page works without them
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadWorkshop()
    return () => {
      cancelled = true
    }
  }, [ok, params.id])

  const formatWorkshopDateTime = (isoDate: string): string => {
    try {
      const date = new Date(isoDate)
      const days = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]
      const months = [
        "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
        "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"
      ]
      
      const dayName = days[date.getDay()]
      const day = date.getDate()
      const monthName = months[date.getMonth()]
      const hour = date.getHours().toString().padStart(2, "0")
      const minute = date.getMinutes().toString().padStart(2, "0")
      
      return `${dayName}, ${day} ${monthName}, ${hour}:${minute}`
    } catch {
      return isoDate
    }
  }

  const getErrorMessage = (errorCode: string | null): string => {
    switch (errorCode) {
      case "invalid_token":
        return "Link-ul de înscriere este invalid sau a expirat."
      case "user_not_found":
        return "Contul asociat cu acest link nu a fost găsit."
      case "workshop_not_found":
        return "Meditația nu a fost găsită."
      case "workshop_not_published":
        return "Meditația nu este disponibilă."
      case "server_error":
        return "A apărut o eroare. Te rugăm să încerci din nou."
      case "capacity_bump_failed":
        return "Nu am putut rezerva locul (capacitate depășită)."
      case "insert_failed":
        return "Nu am putut finaliza înscrierea. Te rugăm să încerci din nou."
      default:
        return "A apărut o eroare necunoscută."
    }
  }

  return (
    <>
      <Navigation />
      <main
        className={cn(
          "min-h-[100dvh] bg-[#fafafa] pt-14 burger:pt-16",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
        )}
      >
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#9ca3af]" />
            </div>
          ) : ok ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-8 sm:px-8 sm:py-12">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-8 w-8 shrink-0 text-[#7c3aed]" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">
                    Înscrierea ta este confirmată!
                  </h1>
                  
                  {workshop ? (
                    <div className="mt-6 space-y-3 rounded-lg bg-[#faf5ff] p-4">
                      <div>
                        <p className="text-sm font-medium text-[#6b7280]">Meditație</p>
                        <p className="mt-1 text-base font-semibold text-[#111827]">{workshop.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#6b7280]">Când</p>
                        <p className="mt-1 text-base text-[#111827]">
                          {formatWorkshopDateTime(workshop.starts_at)}
                        </p>
                      </div>
                      {workshop.teacher_name ? (
                        <div>
                          <p className="text-sm font-medium text-[#6b7280]">Profesor</p>
                          <p className="mt-1 text-base text-[#111827]">{workshop.teacher_name}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-6 rounded-lg border-l-4 border-[#7c3aed] bg-[#faf5ff] p-4">
                    <p className="text-sm font-semibold text-[#7c3aed]">Important</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#374151]">
                      Pentru a intra la meditație (link Meet), trebuie să fii conectat în contul PLANCK 
                      care are <span className="font-semibold">acest email</span>.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="inline-flex items-center justify-center rounded-lg bg-[#7c3aed] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9]"
                    >
                      Intră în cont
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/pregatire/${params.id}`)}
                      className="inline-flex items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-6 py-3 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb]"
                    >
                      Vezi detalii meditație
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-8 sm:px-8 sm:py-12">
              <div className="flex items-start gap-3">
                <XCircle className="h-8 w-8 shrink-0 text-[#dc2626]" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">
                    Înscrierea nu a reușit
                  </h1>
                  <p className="mt-4 text-base leading-relaxed text-[#6b7280]">
                    {getErrorMessage(error)}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => router.push("/pregatire")}
                      className="inline-flex items-center justify-center rounded-lg bg-[#7c3aed] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9]"
                    >
                      Înapoi la pregătiri
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/contact")}
                      className="inline-flex items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-6 py-3 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb]"
                    >
                      Contactează-ne
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

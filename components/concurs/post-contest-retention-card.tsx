"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"

import { DashboardPromoCardLayout } from "@/components/dashboard/dashboard-promo-card-layout"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

type PostContestRetentionCardProps = {
  imageSrc?: string
}

const purpleStartClassName = cn(
  "dashboard-start-glow relative z-[1] inline-flex w-full min-h-[3rem] items-center justify-center rounded-full",
  "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]",
  "px-3 py-3.5 text-sm font-semibold leading-tight text-white antialiased",
  "shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow]",
  "hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6]",
  "active:translate-y-1 active:shadow-[0_1px_0_#5b21b6]",
  "disabled:pointer-events-none disabled:opacity-80",
  "sm:min-h-[3.25rem] sm:px-4 sm:py-3 sm:text-base sm:leading-none"
)

const startGlowStyle = { "--start-glow-tint": "rgba(221, 211, 255, 0.84)" } as CSSProperties

export function PostContestRetentionCard({ imageSrc = "/dashboard-card.png" }: PostContestRetentionCardProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const handlePremiumClick = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      toast({
        title: "Autentificare necesară",
        description: "Te rugăm să te autentifici din nou.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/premium-prelaunch/signup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      })

      const data = (await response.json()) as { error?: string; ok?: boolean }

      if (response.status === 401) {
        toast({
          title: "Sesiune expirată",
          description: data.error || "Autentifică-te din nou.",
          variant: "destructive"
        })
        return
      }

      if (!response.ok) {
        toast({
          title: "Nu am putut salva",
          description: data.error || "Încearcă din nou.",
          variant: "destructive"
        })
        return
      }

      setIsRegistered(true)
    } catch {
      toast({
        title: "Eroare de rețea",
        description: "Verifică conexiunea și încearcă din nou.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardPromoCardLayout
      imageSrc={imageSrc}
      imageAlt="Planck"
      footer={
        <div className="mt-5 w-full sm:mt-6">
          {isRegistered ? (
            <Link
              href="/dashboard"
              className={purpleStartClassName}
              style={startGlowStyle}
            >
              <span className="relative z-[1] inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                <span className="min-w-0">Mergi la dashboard</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </span>
            </Link>
          ) : (
            <button
              type="button"
              className={purpleStartClassName}
              style={startGlowStyle}
              disabled={isSubmitting}
              onClick={() => void handlePremiumClick()}
            >
              <span className="relative z-[1] inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                    <span className="min-w-0">Se salvează…</span>
                  </>
                ) : (
                  <>
                    <span className="min-w-0">Descoperă planul Premium</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </>
                )}
              </span>
            </button>
          )}
          {!isRegistered ? (
            <p className="mt-3 text-center text-[0.8125rem] leading-snug text-black/45 sm:text-sm">
              Fără card bancar.
            </p>
          ) : null}
        </div>
      }
    >
      {isRegistered ? (
        <>
          <h2 className="mt-6 px-0.5 text-[1.125rem] font-bold leading-snug tracking-tight text-black sm:mt-10 sm:text-2xl sm:leading-tight">
            Ești pe listă!
          </h2>
          <p className="mt-3 px-0.5 text-[0.8125rem] leading-relaxed text-black/70 sm:text-sm sm:leading-relaxed">
            Te anunțăm primii când lansăm Premium.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-6 px-0.5 text-[1.125rem] font-bold leading-snug tracking-tight text-black sm:mt-10 sm:text-2xl sm:leading-tight">
            Concursul s-a încheiat. Acum începe partea interesantă.
          </h2>
          <p className="mt-3 px-0.5 text-[0.8125rem] leading-relaxed text-black/70 sm:text-sm sm:leading-relaxed">
            Aceleași tipuri de probleme te așteaptă pe Planck — și de data asta ai Insight lângă tine pentru
            rezolvări complete, pas cu pas.
          </p>
        </>
      )}
    </DashboardPromoCardLayout>
  )
}

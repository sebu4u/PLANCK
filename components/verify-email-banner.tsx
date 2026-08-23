"use client"

import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useResendConfirmationEmail } from "@/hooks/use-resend-confirmation"
import { isEmailVerified } from "@/lib/email-verification"

export function VerifyEmailBanner({ className }: { className?: string }) {
  const { profile } = useAuth()
  const { resend, resending } = useResendConfirmationEmail()

  if (isEmailVerified(profile)) return null

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ece7ff] bg-[#f7f4ff] px-4 py-3 ${className ?? ""}`}
    >
      <p className="text-sm font-medium leading-snug text-[#3f3356]">
        Confirmă-ți emailul ca să nu pierzi acces la notificări
      </p>
      <button
        type="button"
        onClick={() => void resend()}
        disabled={resending}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-[#d4c6f5] bg-white px-3 text-xs font-semibold text-[#5f2fc3] transition-colors hover:bg-[#f4eeff] disabled:opacity-60"
      >
        {resending ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Se retrimite...
          </span>
        ) : (
          "Retrimite email"
        )}
      </button>
    </div>
  )
}

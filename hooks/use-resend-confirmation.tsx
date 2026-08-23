"use client"

import { useCallback, useState } from "react"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { sendConfirmationEmailRequest } from "@/lib/email-confirmation-client"
import { EMAIL_CONFIRMATION_RATE_LIMIT_SECONDS } from "@/lib/email-verification"
import { supabase } from "@/lib/supabaseClient"

export function useResendConfirmationEmail() {
  const { toast } = useToast()
  const [resending, setResending] = useState(false)

  const resend = useCallback(async () => {
    if (resending) return
    setResending(true)
    try {
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      if (!accessToken) {
        toast({
          title: "Nu ești autentificat",
          description: "Reautentifică-te ca să retrimiți emailul.",
          variant: "destructive",
        })
        return
      }
      const result = await sendConfirmationEmailRequest(accessToken)
      if (result.alreadyVerified) {
        toast({
          title: "Email deja confirmat",
          description: "Poți continua fără să retrimiți.",
        })
        return
      }
      if (result.rateLimited) {
        toast({
          title: "Prea multe încercări",
          description: `Așteaptă ${EMAIL_CONFIRMATION_RATE_LIMIT_SECONDS} de secunde, apoi încearcă din nou.`,
          variant: "destructive",
        })
        return
      }
      if (!result.ok) {
        toast({
          title: "Nu s-a putut retrimite emailul",
          description: result.error || "Verifică și folderul Spam.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Email retrimis",
        description: "Verifică inbox-ul și folderul Spam.",
      })
    } finally {
      setResending(false)
    }
  }, [resending, toast])

  const toastUnverified = useCallback(
    (title: string, description: string) => {
      toast({
        title,
        description,
        variant: "destructive",
        action: (
          <ToastAction altText="Retrimite email" onClick={() => void resend()}>
            Retrimite email
          </ToastAction>
        ),
      })
    },
    [resend, toast],
  )

  return { resend, resending, toastUnverified }
}

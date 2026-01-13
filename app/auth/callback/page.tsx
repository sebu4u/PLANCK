"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for errors in URL
    const errorParam = searchParams.get("error")
    const errorDesc = searchParams.get("error_description")

    if (errorParam) {
      setError(errorDesc || "A apărut o eroare la autentificare.")
      return
    }

    const handleSession = async () => {
      // Supabase v2 handles hash parsing internally when using the client.
      // We just need to confirm session is set, then redirect.
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        // Process referral if there's a stored referral code
        await processReferralIfNeeded(data.session.user.id)
        router.replace("/")
      } else {
        // If no session yet, wait briefly then check again (OAuth callback may be processing)
        setTimeout(async () => {
          const { data: data2 } = await supabase.auth.getSession()
          if (data2.session) {
            // Process referral if there's a stored referral code
            await processReferralIfNeeded(data2.session.user.id)
            router.replace("/")
          } else {
            // If still no session, check if we have a hash error (sometimes not in searchParams)
            const hash = window.location.hash
            if (hash && hash.includes("error=")) {
              // Let the parse happen naturally or just show generic error if timeout
              setError("Autentificarea a eșuat sau a expirat. Te rugăm să încerci din nou.")
            } else {
              // If no session, redirect to register page
              router.replace("/register")
            }
          }
        }, 2000) // Increased timeout for slower devices/networks
      }
    }

    const processReferralIfNeeded = async (userId: string) => {
      if (processing) return

      try {
        // Check if there's a stored referral code
        const referralCode = localStorage.getItem("planck_referral_code")
        if (!referralCode) return

        setProcessing(true)
        console.log("Processing referral for user:", userId, "with code:", referralCode)

        // Wait a bit for the profile to be created by the trigger
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Process the referral
        const response = await fetch("/api/referral/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referral_code: referralCode,
            referred_user_id: userId,
          }),
        })

        const result = await response.json()
        console.log("Referral processing result:", result)

        if (result.success) {
          // Clear the stored referral code after successful processing
          localStorage.removeItem("planck_referral_code")
          console.log("Referral processed successfully!")
        } else {
          console.error("Referral processing failed:", result.error)
          // Still clear the code to prevent repeated attempts
          localStorage.removeItem("planck_referral_code")
        }
      } catch (error) {
        console.error("Error processing referral:", error)
        // Clear the code on error to prevent loops
        localStorage.removeItem("planck_referral_code")
      } finally {
        setProcessing(false)
      }
    }

    handleSession()
  }, [router, processing, searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-[#101113] flex items-center justify-center p-4">
        <div className="bg-[#1A1B1E] p-8 rounded-2xl max-w-md w-full text-center border border-white/10">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Eroare la autentificare</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="w-full h-12 bg-white hover:bg-gray-100 text-black rounded-full font-medium transition-colors"
          >
            Înapoi la Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101113] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Se procesează autentificarea...</p>
      </div>
    </div>
  )
}

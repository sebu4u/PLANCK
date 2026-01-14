"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
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
            // If no session, redirect to register page
            router.replace("/register")
          }
        }, 800)
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
  }, [router, processing])

  return (
    <div className="min-h-screen bg-[#101113] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Se procesează autentificarea...</p>
      </div>
    </div>
  )
}

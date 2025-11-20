"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleSession = async () => {
      // Supabase v2 handles hash parsing internally when using the client.
      // We just need to confirm session is set, then redirect.
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace("/")
      } else {
        // If no session yet, wait briefly then check again (OAuth callback may be processing)
        setTimeout(async () => {
          const { data: data2 } = await supabase.auth.getSession()
          if (data2.session) router.replace("/")
          else {
            // If no session, redirect to register page
            router.replace("/register")
          }
        }, 800)
      }
    }
    handleSession()
  }, [router])

  return null
}



"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { TrophyRoadManager } from "@/components/admin/trophy-road-manager"
import { supabase } from "@/lib/supabaseClient"

export default function AdminTrophyRoadPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (authLoading) return
      if (!user) {
        router.push("/login")
        return
      }
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) {
          router.push("/login")
          return
        }
        const res = await fetch("/api/admin/trophy-road", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 403) {
          setAllowed(false)
        } else if (res.ok) {
          setAllowed(true)
        } else if (res.status === 401) {
          router.push("/login")
          return
        } else {
          setAllowed(false)
        }
      } catch {
        setAllowed(false)
      } finally {
        setChecking(false)
      }
    }
    void run()
  }, [authLoading, router, user])

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8 pt-24">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Admin · Trophy Road</h1>
        <p className="mb-6 text-sm text-white/60">
          Configurează recompensele pe pragurile de trofee (aceleași tipuri ca la PLANCKPASS).
        </p>
        {checking || authLoading ? (
          <div className="flex items-center gap-2 text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se verifică accesul…
          </div>
        ) : allowed ? (
          <TrophyRoadManager />
        ) : (
          <p className="text-red-300">Acces interzis.</p>
        )}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { PlanckPassManager } from "@/components/admin/planckpass-manager"
import { supabase } from "@/lib/supabaseClient"

export default function AdminPlanckPassPage() {
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
        const res = await fetch("/api/admin/planckpass", {
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
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Admin · PLANCKPASS</h1>
        {checking || authLoading ? (
          <div className="flex items-center gap-2 text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se verifică accesul…
          </div>
        ) : allowed ? (
          <PlanckPassManager />
        ) : (
          <p className="text-red-300">Acces interzis.</p>
        )}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { useAdmin } from "@/hooks/use-admin"
import { Navigation } from "@/components/navigation"
import { ContentReportsManager } from "@/components/admin/content-reports-manager"
import { Button } from "@/components/ui/button"

export default function AdminContentReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return

      if (!user) {
        router.push("/login")
        return
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) {
          router.push("/login")
          return
        }

        const response = await fetch("/api/admin/content-reports", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (response.status === 403) {
          setError("Acces interzis. Doar adminii pot accesa această pagină.")
          setIsVerifiedAdmin(false)
        } else if (response.ok) {
          setIsVerifiedAdmin(true)
        } else if (response.status === 401) {
          router.push("/login")
          return
        } else {
          setError("Eroare la verificarea permisiunilor.")
          setIsVerifiedAdmin(false)
        }
      } catch {
        setError("Eroare la verificarea permisiunilor.")
        setIsVerifiedAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    void checkAdmin()
  }, [user, authLoading, router])

  if (authLoading || checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isVerifiedAdmin) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="mx-auto max-w-md px-4 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-semibold">Acces interzis</h2>
            <p className="mb-2 text-gray-400">{error || "Doar adminii pot accesa această pagină."}</p>
            {!isAdmin && (
              <p className="mb-4 text-xs text-gray-500">Contul curent nu are drepturi de administrare.</p>
            )}
            <Button
              onClick={() => router.push("/invata")}
              variant="outline"
              className="border-white/30 bg-white/5 text-gray-100 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la învață
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="container mx-auto max-w-[1500px] px-4 pb-8 pt-24">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/invata")}
              className="text-gray-200 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Înapoi la învață
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/learning-paths")}
              className="text-gray-200 hover:bg-white/10 hover:text-white"
            >
              Learning paths
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/dev-users")}
              className="text-gray-200 hover:bg-white/10 hover:text-white"
            >
              Dev users
            </Button>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Rapoarte de probleme</h1>
          <p className="text-gray-400">
            Rapoartele trimise de utilizatori de pe learning path, probleme, grile și lecții.
          </p>
        </div>

        <ContentReportsManager />
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { useAdmin } from "@/hooks/use-admin"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { LessonsManager } from "@/components/admin/lessons-manager"

export default function AdminLessonsPage() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificare admin server-side prin API
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

        // Verifică dacă este admin prin API (face verificare server-side completă)
        const response = await fetch("/api/admin/lessons", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
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
      } catch (err) {
        console.error("Failed to check admin status:", err)
        setError("Eroare la verificarea permisiunilor.")
        setIsVerifiedAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [user, authLoading, router])

  // Loading state
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Not admin
  if (!isVerifiedAdmin) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-semibold text-white mb-2">Acces interzis</h2>
            <p className="text-gray-400 mb-6">{error || "Doar adminii pot accesa această pagină."}</p>
            <Button onClick={() => router.push("/cursuri")} variant="outline" className="border-white/30 bg-white/5 text-gray-100 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la cursuri
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/cursuri")}
              className="text-gray-200 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Cursuri
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Administrare Lecții și Capitole</h1>
          <p className="text-gray-400">
            Adaugă și editează capitole și lecții pentru toate clasele. Modificările sunt vizibile imediat pe platformă.
          </p>
        </div>

        <LessonsManager />
      </div>
    </div>
  )
}

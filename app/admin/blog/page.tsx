"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useAdmin } from "@/hooks/use-admin"
import { Navigation } from "@/components/navigation"
import { BlogManager } from "@/components/admin/blog-manager"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

export default function AdminBlogPage() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      if (authLoading) return
      if (!user) { router.replace("/login"); return }
      const { data } = await supabase.auth.getSession()
      if (!data.session?.access_token) { router.replace("/login"); return }
      const response = await fetch("/api/admin/blog", { headers: { Authorization: `Bearer ${data.session.access_token}` } })
      setAllowed(response.ok)
      setChecking(false)
    }
    void checkAccess()
  }, [authLoading, router, user])

  if (authLoading || checking) return <div className="flex min-h-screen items-center justify-center bg-black text-white"><Loader2 className="animate-spin" /></div>
  if (!allowed) {
    return (
      <div className="min-h-screen bg-black text-white"><Navigation /><div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 text-center">
        <div><AlertCircle className="mx-auto mb-4 h-14 w-14 text-red-400" /><h1 className="text-2xl font-bold">Acces interzis</h1><p className="mt-2 text-gray-400">{isAdmin ? "Nu am putut verifica permisiunile." : "Doar adminii pot administra blogul."}</p><Button className="mt-6" variant="outline" onClick={() => router.push("/")}><ArrowLeft className="mr-2 h-4 w-4" />Acasă</Button></div>
      </div></div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="mx-auto max-w-[1500px] px-4 pb-12 pt-24">
        <Button variant="ghost" size="sm" className="mb-4 text-gray-300" onClick={() => router.push("/admin/learning-paths")}><ArrowLeft className="mr-2 h-4 w-4" />Administrare</Button>
        <h1 className="text-3xl font-bold">Blog SEO</h1>
        <p className="mt-2 text-gray-400">Organizează categoriile și articolele, apoi publică sau programează conținutul.</p>
        <div className="mt-7"><BlogManager /></div>
      </main>
    </div>
  )
}

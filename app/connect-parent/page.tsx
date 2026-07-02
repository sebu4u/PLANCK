"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { normalizeParentInviteCode } from "@/lib/parent/invite-code"

function ConnectParentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, loading: authLoading, isStudent, refreshProfile } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [parentName, setParentName] = useState<string | null>(null)

  const code = normalizeParentInviteCode(searchParams.get("code") ?? "")

  useEffect(() => {
    if (authLoading) return
    if (!code) return

    if (!user) {
      const callback = `/connect-parent?code=${encodeURIComponent(code)}`
      router.replace(`/login?redirect=${encodeURIComponent(callback)}`)
    }
  }, [authLoading, user, code, router])

  const handleAccept = async () => {
    if (!user || !code) return

    if (!isStudent) {
      toast({
        title: "Doar elevii se pot conecta",
        description: "Contul tău nu este de tip elev.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error("no_session")

      const response = await fetch("/api/parent/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "accept_failed")
      }

      setParentName(payload.parent_name ?? "Părintele tău")
      setConnected(true)
      await refreshProfile()
      toast({
        title: "Conectat cu succes",
        description: "Contul tău este acum legat de contul părintelui.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "accept_failed"
      toast({
        title: "Nu am putut finaliza conexiunea",
        description:
          message === "INVALID_INVITE_CODE"
            ? "Link-ul de invitație nu este valid."
            : message === "ONLY_STUDENTS_CAN_LINK"
              ? "Doar conturile de elev pot fi conectate."
              : "Încearcă din nou peste câteva secunde.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6b7280]" />
      </div>
    )
  }

  if (!code) {
    return (
      <Card className="mx-auto max-w-lg border-[#eceff3]">
        <CardHeader>
          <CardTitle>Link invalid</CardTitle>
          <CardDescription>Lipsește codul de invitație din link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Mergi la dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (connected) {
    return (
      <Card className="mx-auto max-w-lg border-[#eceff3]">
        <CardHeader>
          <CardTitle>Ești conectat</CardTitle>
          <CardDescription>
            {parentName} poate acum să urmărească progresul tău pe PLANCK.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Mergi la dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-lg border-[#eceff3]">
      <CardHeader>
        <CardTitle>Conectează-te la părinte</CardTitle>
        <CardDescription>
          Confirmă că vrei să legi contul tău de elev de contul părintelui care ți-a trimis link-ul.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-xl bg-[#f8f8fb] px-4 py-3 text-sm text-[#374151]">
          Cod invitație: <span className="font-mono font-semibold">{code}</span>
        </p>
        <Button type="button" className="w-full" disabled={submitting || !user} onClick={handleAccept}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se conectează...
            </span>
          ) : (
            "Confirmă conexiunea"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ConnectParentPage() {
  return (
    <div className="min-h-screen bg-[#ffffff] px-4 py-10">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#6b7280]" />
          </div>
        }
      >
        <ConnectParentContent />
      </Suspense>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function PushPrompt({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    setSupported(
      Boolean(
        vapidPublic &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          "serviceWorker" in navigator &&
          "PushManager" in window,
      ),
    )
  }, [])

  if (!isLoggedIn || !supported) return null

  const enable = async () => {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublic) return

    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast({
          title: "Notificările sunt blocate",
          description: "Activează-le din setările browserului.",
          variant: "destructive",
        })
        return
      }

      const registration = await navigator.serviceWorker.register("/sw-pregatire.js")
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      })

      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return

      const json = subscription.toJSON()
      const response = await fetch("/api/pregatire/push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error ?? "Eroare")
      }

      setEnabled(true)
      toast({
        title: "Notificări activate",
        description: "Te anunțăm cu 24h și 30 min înainte de pregătirile deblocate.",
      })
    } catch (error) {
      toast({
        title: "Nu am putut activa notificările",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-[#e5e7eb] bg-white/80 text-[#374151]"
      disabled={loading || enabled}
      onClick={() => void enable()}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : enabled ? (
        <Bell className="mr-2 h-4 w-4 text-emerald-600" />
      ) : (
        <BellOff className="mr-2 h-4 w-4" />
      )}
      {enabled ? "Notificări active" : "Activează notificările"}
    </Button>
  )
}

"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"

export function CustomRouteGeneratorForm() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = prompt.trim()
    if (trimmed.length < 3) {
      setError("Scrie ce vrei să exersezi.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        setError("Autentifică-te pentru a genera trasee personalizate.")
        return
      }

      const response = await fetch("/api/learning-path/custom-routes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: trimmed }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.error || "Nu am putut genera traseul.")
      }

      const routeId = body?.route?.id
      if (!routeId) throw new Error("Răspuns invalid de la server.")
      router.push(`/invata/trasee-personalizate/${routeId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut genera traseul.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_18px_60px_rgba(76,29,149,0.08)]">
      <div>
        <label htmlFor="custom-route-prompt" className="text-sm font-semibold text-[#241833]">
          Ce vrei să repari sau să exersezi?
        </label>
        <Textarea
          id="custom-route-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ex: vreau un traseu scurt pentru greșelile mele la cinematică și grafice"
          className="mt-2 min-h-28 rounded-2xl border-violet-100 bg-[#fbfaff]"
          maxLength={500}
        />
      </div>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <Button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-5 hover:bg-violet-700">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Generează traseul
      </Button>
    </form>
  )
}

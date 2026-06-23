"use client"

import { useCallback, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"

type Mode = "admin" | "dev"

export type TextItemImageInserterProps = {
  itemId: string
  mode: Mode
  subject?: string
  onInsert: (markdownTag: string) => void
  disabled?: boolean
}

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"

function readErrorMessage(raw: unknown, fallback: string): string {
  if (raw && typeof raw === "object" && "error" in raw) {
    const e = (raw as { error?: unknown }).error
    if (typeof e === "string" && e.trim()) return e
  }
  if (typeof raw === "string" && raw.trim()) return raw
  return fallback
}

export function TextItemImageInserter({
  itemId,
  mode,
  subject,
  onInsert,
  disabled,
}: TextItemImageInserterProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const indexRef = useRef(0)

  const onFilePicked = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (file.size > MAX_BYTES) {
        setError("Fișierul este prea mare (maxim 4 MB).")
        if (inputRef.current) inputRef.current.value = ""
        return
      }
      setError(null)
      setUploading(true)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) {
          throw new Error("Sesiune expirată.")
        }

        const form = new FormData()
        form.append("file", file)
        form.append("kind", "item")
        form.append("id", itemId)
        form.append("field", "image")
        form.append("index", String(indexRef.current))
        if (mode === "dev" && subject) {
          form.append("subject", subject)
        }

        const url =
          mode === "admin"
            ? "/api/admin/learning-paths/upload"
            : "/api/dev/learning-paths/upload"

        const response = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        })

        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
        if (!response.ok) {
          throw new Error(readErrorMessage(data, "Upload eșuat."))
        }
        const publicUrl = typeof data.url === "string" ? data.url : null
        if (!publicUrl) {
          throw new Error("Răspuns invalid de la server.")
        }

        const altText = file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "imagine"
        const tag = `\n![${altText}](${publicUrl})\n`
        onInsert(tag)
        indexRef.current += 1
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload eșuat.")
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [itemId, mode, onInsert, subject],
  )

  return (
    <div className="inline-flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_ACCEPT}
        onChange={onFilePicked}
        disabled={uploading || disabled}
        className="hidden"
        aria-label="Încarcă imagine"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading || disabled}
        onClick={() => inputRef.current?.click()}
        className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
        title="Încarcă o imagine de pe computer și o inserează la cursor"
      >
        {uploading ? "Se încarcă…" : "Insert image"}
      </Button>
      {error ? <span className="text-[11px] text-red-300">{error}</span> : null}
    </div>
  )
}

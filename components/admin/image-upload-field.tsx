"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ImageKind = "chapter" | "lesson"

export type ImageUploadFieldProps = {
  value: string | null
  onChange: (next: string | null) => void
  kind: ImageKind
  id: string
  /** "admin" routes to /api/admin/learning-paths/upload; "dev" to /api/dev/... */
  mode: "admin" | "dev"
  /** dev-only: subject marker forwarded to the upload route */
  subject?: string
  label?: string
  className?: string
  /** Visual size hint for the preview. */
  previewSize?: "sm" | "md" | "lg"
}

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"

const PREVIEW_CLASS: Record<NonNullable<ImageUploadFieldProps["previewSize"]>, string> = {
  sm: "h-14 w-14",
  md: "h-20 max-w-[200px]",
  lg: "h-32 max-w-[280px]",
}

function readErrorMessage(raw: unknown, fallback: string): string {
  if (raw && typeof raw === "object" && "error" in raw) {
    const e = (raw as { error?: unknown }).error
    if (typeof e === "string" && e.trim()) return e
  }
  if (typeof raw === "string" && raw.trim()) return raw
  return fallback
}

export function ImageUploadField({
  value,
  onChange,
  kind,
  id,
  mode,
  subject,
  label,
  className,
  previewSize = "md",
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = localPreview ?? value ?? null

  useEffect(() => {
    setLocalPreview(null)
    setUrlDraft("")
    setError(null)
  }, [id, kind])

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_BYTES) {
        setError("Fișierul este prea mare (maxim 4 MB).")
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
        form.append("kind", kind)
        form.append("id", id)
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
        onChange(publicUrl)
        if (localPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(localPreview)
        }
        setLocalPreview(null)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload eșuat.")
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [id, kind, localPreview, mode, onChange, subject],
  )

  const onFilePicked = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview)
      }
      setLocalPreview(URL.createObjectURL(file))
      void uploadFile(file)
    },
    [localPreview, uploadFile],
  )

  const onRemove = useCallback(async () => {
    if (!value) {
      onChange(null)
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
      const bucketMarker = "/storage/v1/object/public/lesson-images/"
      const idx = value.indexOf(bucketMarker)
      if (idx !== -1) {
        const path = value.slice(idx + bucketMarker.length)
        if (path.startsWith("official/")) {
          const url =
            mode === "admin"
              ? "/api/admin/learning-paths/upload"
              : "/api/dev/learning-paths/upload"
          await fetch(url, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ path }),
          })
        }
      }
      onChange(null)
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview)
      }
      setLocalPreview(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ștergere eșuată.")
    } finally {
      setUploading(false)
    }
  }, [localPreview, mode, onChange, value])

  const onUrlConfirm = useCallback(() => {
    const next = urlDraft.trim()
    onChange(next || null)
    setShowUrlInput(false)
  }, [onChange, urlDraft])

  const previewClass = PREVIEW_CLASS[previewSize]

  return (
    <div className={className}>
      {label ? (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_ACCEPT}
          onChange={onFilePicked}
          disabled={uploading}
          className="hidden"
          aria-label={label ?? "Încarcă imagine"}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="border-white/20 bg-black/40 text-gray-100 hover:bg-black/60"
        >
          {uploading ? "Se încarcă…" : value ? "Înlocuiește" : "Încarcă imagine"}
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => void onRemove()}
            className="border-white/20 bg-black/40 text-gray-100 hover:bg-black/60"
          >
            Elimină
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={uploading}
          onClick={() => {
            setUrlDraft(value ?? "")
            setShowUrlInput((prev) => !prev)
          }}
          className="text-gray-400 hover:text-gray-200"
        >
          {showUrlInput ? "Ascunde URL" : "sau lipește un URL"}
        </Button>
      </div>
      {showUrlInput ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="h-9 flex-1 border-white/20 bg-black/40 text-sm text-gray-100"
          />
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            onClick={onUrlConfirm}
            className="shrink-0 bg-emerald-700 text-white hover:bg-emerald-600"
          >
            Aplică URL
          </Button>
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 text-[11px] text-red-300">{error}</p>
      ) : null}
      {previewUrl ? (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className={`rounded-md border border-white/15 object-cover ${previewClass}`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}
    </div>
  )
}

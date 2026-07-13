"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_BLOG_AD_CARD_ATTRS,
  normalizeBlogAdCardAttrs,
  type BlogAdCardAttrs,
} from "@/components/blog/tiptap/blog-ad-card-types"

type BlogAdCardDialogProps = {
  open: boolean
  mode: "insert" | "edit"
  initialValues?: BlogAdCardAttrs
  onOpenChange: (open: boolean) => void
  onSave: (attrs: BlogAdCardAttrs) => void
}

export function BlogAdCardDialog({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSave,
}: BlogAdCardDialogProps) {
  const [draft, setDraft] = useState<BlogAdCardAttrs>(DEFAULT_BLOG_AD_CARD_ATTRS)

  useEffect(() => {
    if (open) {
      setDraft(normalizeBlogAdCardAttrs(initialValues ?? DEFAULT_BLOG_AD_CARD_ATTRS))
    }
  }, [initialValues, open])

  const close = () => onOpenChange(false)

  const save = () => {
    onSave(normalizeBlogAdCardAttrs(draft))
    close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-[#111111] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "insert" ? "Inserează card promo" : "Editează card promo"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="text-sm">
            Titlu
            <Input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="mt-1 border-white/15 bg-black/30"
            />
          </label>
          <label className="text-sm">
            Text
            <textarea
              value={draft.text}
              onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))}
              className="mt-1 min-h-24 w-full rounded-md border border-white/15 bg-black/30 p-2 text-sm"
            />
          </label>
          <label className="text-sm">
            Text buton CTA
            <Input
              value={draft.ctaLabel}
              onChange={(event) => setDraft((current) => ({ ...current, ctaLabel: event.target.value }))}
              className="mt-1 border-white/15 bg-black/30"
            />
          </label>
          <label className="text-sm">
            Link buton CTA (URL)
            <Input
              value={draft.ctaHref}
              onChange={(event) => setDraft((current) => ({ ...current, ctaHref: event.target.value }))}
              placeholder="/pricing"
              className="mt-1 border-white/15 bg-black/30"
            />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={close}>
            Anulează
          </Button>
          <Button type="button" onClick={save}>
            {mode === "insert" ? "Inserează cardul" : "Salvează cardul"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

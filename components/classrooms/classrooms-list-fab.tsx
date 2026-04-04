"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ClassroomsListFab() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2">
      {open ? (
        <div
          className={cn(
            "pointer-events-auto w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-[#e8eaed] bg-white p-2 shadow-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150"
          )}
          role="menu"
        >
          <Button asChild className="h-10 w-full justify-start font-medium" variant="ghost">
            <Link href="/classrooms/new" onClick={() => setOpen(false)}>
              Creează o clasă
            </Link>
          </Button>
          <Button asChild className="h-10 w-full justify-start font-medium" variant="ghost">
            <Link href="/classrooms/join" onClick={() => setOpen(false)}>
              Intră într-o clasă
            </Link>
          </Button>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Închide meniul" : "Acțiuni clasă"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-lg",
          "transition-transform hover:scale-105 hover:bg-[#1557b0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]"
        )}
      >
        <Plus className="h-7 w-7 stroke-[2.5]" aria-hidden />
      </button>
    </div>
  )
}

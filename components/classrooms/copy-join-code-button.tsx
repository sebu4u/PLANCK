"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CopyJoinCodeButtonProps {
  joinCode: string
  /** Mai compact pentru anteturi / carduri mici */
  compact?: boolean
}

export function CopyJoinCodeButton({ joinCode, compact }: CopyJoinCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    await navigator.clipboard.writeText(joinCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      className={compact ? "h-8 shrink-0 text-xs px-3" : undefined}
      onClick={onCopy}
    >
      {copied ? "Copiat" : "Copiază codul"}
    </Button>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CopyJoinCodeButtonProps {
  joinCode: string
}

export function CopyJoinCodeButton({ joinCode }: CopyJoinCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    await navigator.clipboard.writeText(joinCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Button type="button" variant="outline" onClick={onCopy}>
      {copied ? "Copiat" : "Copiază codul"}
    </Button>
  )
}

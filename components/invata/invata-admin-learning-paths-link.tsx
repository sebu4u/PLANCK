"use client"

import Link from "next/link"
import { Shield } from "lucide-react"
import { useAdmin } from "@/hooks/use-admin"
import { Button } from "@/components/ui/button"

export function InvataAdminLearningPathsLink() {
  const { isAdmin, loading } = useAdmin()

  if (loading || !isAdmin) return null

  return (
    <Link href="/admin/learning-paths">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 border-[#8b5cf6]/35 bg-white text-[#5b21b6] shadow-sm transition-colors hover:bg-[#f5f3ff] hover:text-[#4c1d95]"
      >
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline text-xs font-semibold">Admin Learning Paths</span>
      </Button>
    </Link>
  )
}

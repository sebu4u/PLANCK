"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReportIssueDialog, type ReportIssueContext } from "@/components/content-reports/report-issue-dialog"

type ReportIssueButtonProps = ReportIssueContext & {
  className?: string
  iconClassName?: string
}

export function ReportIssueButton({
  sourceType,
  sourceId,
  sourceMeta,
  className,
  iconClassName,
}: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false)

  if (!sourceId) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6d6d6d] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]",
          className,
        )}
        aria-label="Raportează o problemă"
        title="Raportează o problemă"
      >
        <Flag className={cn("h-4 w-4", iconClassName)} />
      </button>
      <ReportIssueDialog
        open={open}
        onOpenChange={setOpen}
        context={{ sourceType, sourceId, sourceMeta }}
      />
    </>
  )
}

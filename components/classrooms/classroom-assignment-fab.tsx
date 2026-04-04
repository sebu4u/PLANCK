"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { CreateAssignmentForm, type ProblemPoolItem } from "@/components/classrooms/create-assignment-form"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ClassroomAssignmentFabProps {
  classroomId: string
  problems: ProblemPoolItem[]
}

export function ClassroomAssignmentFab({ classroomId, problems }: ClassroomAssignmentFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Creează assignment"
        onClick={() => setOpen(true)}
        className={cn(
          "pointer-events-auto fixed bottom-6 right-6 z-[200] flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-lg",
          "transition-transform hover:scale-105 hover:bg-[#1557b0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]"
        )}
      >
        <Plus className="h-7 w-7 stroke-[2.5]" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          hideClose
          overlayClassName="z-[300] bg-black/35 backdrop-blur-[2px]"
          className={cn(
            "fixed left-1/2 top-1/2 z-[300] flex h-[min(82vh,54rem)] w-[min(94vw,56rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-[28px] border border-[#dbe5f0] bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.24)]"
          )}
        >
          <div className="flex items-center justify-between border-b border-[#e8eaed] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4">
            <div className="space-y-1">
              <DialogTitle className="text-left text-lg font-semibold text-[#111827]">Assignment nou</DialogTitle>
              <p className="text-sm text-[#5f6368]">Alege problemele si completeaza rapid detaliile temei.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-[#d7dce3] bg-white px-4 py-2 text-sm font-medium text-[#5f6368] shadow-sm transition-colors hover:bg-[#f8fafc]"
            >
              Închide
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%)] p-4 md:p-6">
            <CreateAssignmentForm classroomId={classroomId} problems={problems} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

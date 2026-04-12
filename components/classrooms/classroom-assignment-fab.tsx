"use client"

import { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { ArrowRight, Plus, X } from "lucide-react"
import {
  useClassroomAssignmentDraft,
  type AssignmentDraftValues,
} from "@/components/classrooms/classroom-assignment-draft-context"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ClassroomAssignmentFabProps {
  classroomId: string
}

const emptyDraft: AssignmentDraftValues = {
  title: "",
  description: "",
  deadline: "",
}

export function ClassroomAssignmentFab({ classroomId }: ClassroomAssignmentFabProps) {
  const [open, setOpen] = useState(false)
  const { draft, isPickingForClassroom, startPicking } = useClassroomAssignmentDraft()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")

  const isPicking = isPickingForClassroom(classroomId)

  const currentDraft = useMemo(
    () => (isPicking ? draft : emptyDraft),
    [draft, isPicking],
  )

  useEffect(() => {
    if (!open) return
    setTitle(currentDraft.title)
    setDescription(currentDraft.description)
    setDeadline(currentDraft.deadline)
  }, [currentDraft, open])

  const canContinue = title.trim().length > 0

  const handleContinue = () => {
    if (!canContinue) return
    startPicking({
      classroomId,
      draft: {
        title: title.trim(),
        description: description.trim(),
        deadline,
      },
    })
    setOpen(false)
  }

  if (isPicking) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Creează temă"
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
          <div className="relative flex shrink-0 items-start gap-3 border-b border-[#e8eaed] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-3 pr-14 md:px-5 md:py-4 md:pr-14">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-left text-lg font-semibold text-[#111827]">Temă nouă</DialogTitle>
              <p className="hidden text-sm text-[#5f6368] md:block">
                Completează detaliile temei, apoi mergi în catalog ca să alegi exercițiile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-[#5f6368] transition-colors hover:bg-[#eef1f6] hover:text-[#111827] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#1a73e8]/35 md:right-4 md:top-3.5"
              aria-label="Închide"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 md:p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="assignment-title" className="text-sm font-medium text-[#111827]">
                  Titlu
                </label>
                <Input
                  id="assignment-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Tema 1 - Cinematică"
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="assignment-description" className="text-sm font-medium text-[#111827]">
                  Descriere
                </label>
                <Textarea
                  id="assignment-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ce ar trebui să urmărească elevii la tema aceasta?"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="assignment-deadline" className="text-sm font-medium text-[#111827]">
                  Termen limită
                </label>
                <Input
                  id="assignment-deadline"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  name="deadline"
                  type="datetime-local"
                />
              </div>

              <div className="border-t border-[#e8eaed] pt-4">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className={cn(
                    "dashboard-start-glow inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow,opacity] hover:translate-y-1 hover:shadow-[0_1px_0_#5b21b6]",
                    !canContinue && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-[0_4px_0_#5b21b6]",
                  )}
                  style={{ "--start-glow-tint": "rgba(221, 211, 255, 0.84)" } as CSSProperties}
                >
                  <span className="relative z-[1] inline-flex items-center justify-center gap-2">
                    Alege exercițiile
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

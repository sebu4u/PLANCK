"use client"

import { Brain, GraduationCap, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InsightActionButtonsProps {
  onThinkDeeper: () => void
  onTeachMe: () => void
  onSolveProblem: () => void
}

export default function InsightActionButtons({
  onThinkDeeper,
  onTeachMe,
  onSolveProblem,
}: InsightActionButtonsProps) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center flex-wrap mt-3 sm:mt-4 pointer-events-auto">
      <Button
        onClick={onThinkDeeper}
        className="bg-[#101010] text-white border border-[#2f2f2f] rounded-full hover:bg-[#212121] hover:border-[#2f2f2f] transition-all duration-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 min-h-[44px]"
        aria-label="Think Deeper"
      >
        <Brain className="w-4 h-4 flex-shrink-0 text-[#7e7e7e]" />
        <span className="hidden sm:inline">Think Deeper</span>
      </Button>

      <Button
        onClick={onTeachMe}
        className="bg-[#101010] text-white border border-[#2f2f2f] rounded-full hover:bg-[#212121] hover:border-[#2f2f2f] transition-all duration-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 min-h-[44px]"
        aria-label="Teach me"
      >
        <GraduationCap className="w-4 h-4 flex-shrink-0 text-[#7e7e7e]" />
        <span className="hidden sm:inline">Teach me</span>
      </Button>

      <Button
        onClick={onSolveProblem}
        className="bg-[#101010] text-white border border-[#2f2f2f] rounded-full hover:bg-[#212121] hover:border-[#2f2f2f] transition-all duration-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 min-h-[44px]"
        aria-label="Rezolva problema"
      >
        <BookOpen className="w-4 h-4 flex-shrink-0 text-[#7e7e7e]" />
        <span className="hidden sm:inline">Rezolva problema</span>
      </Button>
    </div>
  )
}


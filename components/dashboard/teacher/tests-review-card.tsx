"use client"

import Link from "next/link"
import { ClipboardList } from "lucide-react"
import type { TeacherPendingTestReview } from "@/lib/teacher/server"

interface TestsReviewCardProps {
  tests: TeacherPendingTestReview[]
}

export function TestsReviewCard({ tests }: TestsReviewCardProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <div>
        <h2 className="text-base font-semibold text-[#111827]">Teste de corectat</h2>
        <p className="mt-1 text-sm text-[#6b7280]">Testele publicate la clasele tale</p>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {tests.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f4f6] text-[#9ca3af]">
              <ClipboardList className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm font-medium text-[#111827]">Niciun test deschis</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#6b7280]">
              Când publici un test la o clasă, îl vei vedea aici cu numărul de trimiteri.
            </p>
          </div>
        ) : (
          tests.map((test) => (
            <Link
              key={test.assignment_id}
              href={`/classrooms/${test.classroom_id}/assignments/${test.assignment_id}`}
              className="block rounded-2xl border border-[#eceff3] bg-[#fafafa] p-3 hover:border-[#dbeafe]"
            >
              <p className="truncate text-sm font-semibold text-[#111827]">{test.title}</p>
              <p className="mt-0.5 text-xs text-[#6b7280]">{test.classroom_name}</p>
              <p className="mt-2 text-xs text-[#374151]">
                {test.submitted_count}/{test.student_count} trimiși
                {test.unreviewed_count > 0 ? ` · ${test.unreviewed_count} de revizuit` : ""}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

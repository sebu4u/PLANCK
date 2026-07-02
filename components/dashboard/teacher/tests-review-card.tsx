"use client"

import { ClipboardList } from "lucide-react"

export function TestsReviewCard() {
  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <div>
        <h2 className="text-base font-semibold text-[#111827]">Teste de corectat</h2>
        <p className="mt-1 text-sm text-[#6b7280]">Testele trimise de elevi vor apărea aici</p>
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f4f6] text-[#9ca3af]">
          <ClipboardList className="h-6 w-6" aria-hidden />
        </div>
        <p className="mt-4 text-sm font-medium text-[#111827]">În curând</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#6b7280]">
          Testele pentru clase vor apărea aici de îndată ce lansăm funcționalitatea.
        </p>
      </div>
    </div>
  )
}

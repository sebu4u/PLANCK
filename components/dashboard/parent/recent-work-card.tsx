"use client"

import type { ChildProgressSnapshot } from "@/lib/parent/server"

interface RecentWorkCardProps {
  recentWork: ChildProgressSnapshot["recent_work"]
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function RecentWorkCard({ recentWork }: RecentWorkCardProps) {
  return (
    <section className="rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <div className="mb-4">
        <h2 className="text-lg font-extrabold tracking-tight text-[#080808]">
          Ce a lucrat recent
        </h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          Ultimele activități înregistrate pe platformă.
        </p>
      </div>

      {recentWork.length === 0 ? (
        <p className="rounded-2xl bg-[#fafafa] px-4 py-8 text-center text-sm text-[#6b7280]">
          Încă fără activitate recentă.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#eceff3]">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eceff3] bg-[#fafafa]">
                <th className="px-4 py-3 font-semibold text-[#374151]">Activitate</th>
                <th className="px-4 py-3 font-semibold text-[#374151]">Dată</th>
              </tr>
            </thead>
            <tbody>
              {recentWork.slice(0, 8).map((item) => (
                <tr
                  key={`${item.at}-${item.title}`}
                  className="border-b border-[#f3f4f6] last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-[#111827]">{item.title}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{formatDate(item.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

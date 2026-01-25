import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Fixed background to prevent white flash during navigation */}
      <div className="fixed inset-0 bg-[#080808] -z-10" />
      <div className="relative min-h-screen bg-[#080808]">
        {children}
      </div>
    </>
  )
}


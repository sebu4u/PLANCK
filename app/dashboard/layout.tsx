import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Fixed background to prevent white flash during navigation */}
      <div className="fixed inset-0 bg-[#ffffff] -z-10" />
      <div className="relative min-h-screen bg-[#ffffff]">
        {children}
      </div>
    </>
  )
}


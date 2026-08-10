import type { ReactNode } from "react"

export default function ExerseazaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#ffffff]" />
      <div className="relative min-h-screen bg-[#ffffff]">{children}</div>
    </>
  )
}

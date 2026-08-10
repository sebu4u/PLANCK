import { ReactNode } from "react"

/** Cursuri text: outline #F8FAFD around the white lesson card. */
export default function InvataCursuriLayout({ children }: { children: ReactNode }) {
  return <div className="relative min-h-screen bg-[#F8FAFD] text-gray-900">{children}</div>
}

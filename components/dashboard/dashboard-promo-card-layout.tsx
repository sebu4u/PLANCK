import Image from "next/image"
import { Rocket } from "lucide-react"
import type { ReactNode } from "react"

type DashboardPromoCardLayoutProps = {
  imageSrc: string
  imageAlt?: string
  children: ReactNode
  footer: ReactNode
  /** Set when the image is above the fold (e.g. modal on dashboard) */
  imagePriority?: boolean
}

export function DashboardPromoCardLayout({
  imageSrc,
  imageAlt = "Planck",
  children,
  footer,
  imagePriority = false
}: DashboardPromoCardLayoutProps) {
  return (
    <div className="relative w-full max-w-[460px] rounded-3xl border border-black/10 bg-white px-5 pb-6 pt-32 text-center text-[#0b0b0d] shadow-2xl overflow-visible sm:px-6 sm:pt-36">
      <div className="absolute -top-16 left-0 right-0 px-5 pointer-events-none sm:-top-20 sm:px-6">
        <div className="relative w-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={900}
            height={720}
            className="h-auto w-full"
            priority={imagePriority}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>

      <div className="mt-2 hidden items-center justify-center gap-2 text-black/80 sm:flex">
        <Rocket className="h-5 w-5 text-black" />
        <span className="text-sm font-semibold tracking-[0.2em]">PLANCK</span>
      </div>

      {children}

      {footer}
    </div>
  )
}

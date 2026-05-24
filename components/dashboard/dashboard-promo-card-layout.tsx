import Image from "next/image"
import { Rocket } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type DashboardPromoCardLayoutProps = {
  imageSrc: string
  imageAlt?: string
  children: ReactNode
  footer: ReactNode
  /** Set when the image is above the fold (e.g. modal on dashboard) */
  imagePriority?: boolean
  /** Tighter spacing and smaller hero on small screens */
  compactMobile?: boolean
}

export function DashboardPromoCardLayout({
  imageSrc,
  imageAlt = "Planck",
  children,
  footer,
  imagePriority = false,
  compactMobile = false,
}: DashboardPromoCardLayoutProps) {
  const heroImage = (
    <div className="relative w-full">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={900}
        height={720}
        className="h-auto w-full"
        priority={imagePriority}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-white to-transparent",
          compactMobile ? "h-12 sm:h-16" : "h-16"
        )}
      />
    </div>
  )

  return (
    <div
      className={cn(
        "relative w-full max-w-[460px] rounded-3xl border border-black/10 bg-white text-center text-[#0b0b0d] shadow-2xl",
        compactMobile
          ? "overflow-hidden px-4 pb-4 pt-0 sm:overflow-visible sm:px-6 sm:pb-6 sm:pt-36"
          : "overflow-visible px-5 pb-6 pt-32 sm:px-6 sm:pt-36"
      )}
    >
      <div
        className={cn(
          "pointer-events-none",
          compactMobile
            ? "relative -mx-4 mb-1 sm:absolute sm:-top-20 sm:left-0 sm:right-0 sm:mx-0 sm:mb-0 sm:px-6"
            : "absolute -top-16 left-0 right-0 px-5 sm:-top-20 sm:px-6"
        )}
      >
        {heroImage}
      </div>

      <div className="relative z-[1]">
        <div className="mt-2 hidden items-center justify-center gap-2 text-black/80 sm:flex">
          <Rocket className="h-5 w-5 text-black" />
          <span className="text-sm font-semibold tracking-[0.2em]">PLANCK</span>
        </div>

        {children}

        {footer}
      </div>
    </div>
  )
}

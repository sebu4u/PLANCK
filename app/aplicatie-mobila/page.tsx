"use client"

import { X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function MobileAppUnavailablePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/probleme"

  const handleClose = () => {
    const referrer = document.referrer
    if (referrer && referrer.startsWith(window.location.origin)) {
      router.back()
      return
    }

    router.push(returnTo)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Închide"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#0b0d10]/10 text-[#0b0d10]/70 transition-colors hover:bg-[#f5f5f5] hover:text-[#0b0d10]"
        >
          <X className="h-4 w-4" />
        </button>

        <img
          src="/streak-icon.png"
          alt="PLANCK"
          className="h-64 w-64 object-contain sm:h-72 sm:w-72"
          width={288}
          height={288}
        />

        <h1 className="mt-10 text-2xl font-bold leading-tight text-[#0b0d10] sm:text-3xl">
          Profita la maxim de ceea ce ofera PLANCK
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-[#2C2F33]/75 sm:text-lg">
          Aplicatia mobila urmeaza sa fie disponibila si pentru device-ul tau
        </p>
      </div>
    </main>
  )
}

import Image from "next/image"
import Link from "next/link"
import { CalendarDays } from "lucide-react"

export function ExerseazaPregatirePromoCard() {
  return (
    <Link
      href="/pregatire"
      className="group relative mt-6 block overflow-visible transition-transform active:scale-[0.99]"
    >
      {/*
        Tall red layers tuck ~14px under the pink card so rotation never
        opens a seam against the page background.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 left-5 right-5 z-0 h-9 origin-[50%_100%] rounded-t-2xl bg-[#b91c1c] transition-transform duration-300 ease-out will-change-transform [backface-visibility:hidden] group-hover:-translate-x-3 group-hover:-rotate-6 sm:left-6 sm:right-6 sm:group-hover:-translate-x-4"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-2.5 left-2.5 right-2.5 z-10 h-8 origin-[50%_100%] rounded-t-2xl bg-[#ef4444] transition-transform duration-300 ease-out will-change-transform [backface-visibility:hidden] group-hover:translate-x-2.5 group-hover:rotate-[4deg] sm:left-3 sm:right-3 sm:group-hover:translate-x-3.5"
      />

      {/* Main card stays put vertically — lifting it opened white gaps */}
      <div className="relative z-20 flex min-h-[9.5rem] overflow-hidden rounded-3xl bg-[#fee2e2]">
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between px-5 py-4 pr-32">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1f2937]">Pregătiri</h2>
            <p className="mt-1 text-sm leading-snug text-[#4b5563]">
              Workshop-uri live cu profesori, în fiecare săptămână
            </p>
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#6b7280]">
            <CalendarDays className="h-4 w-4 text-[#ef4444]" aria-hidden />
            Vezi calendarul
          </p>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-1 h-[145%] w-[9.5rem]"
        >
          <Image
            src="/images/exerseaza/pregatiri-icon.png"
            alt=""
            fill
            sizes="160px"
            className="object-contain object-bottom transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            priority
          />
        </span>
      </div>
    </Link>
  )
}

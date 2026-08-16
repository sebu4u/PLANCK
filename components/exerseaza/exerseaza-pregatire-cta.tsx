import Image from "next/image"
import Link from "next/link"
import { Plus } from "lucide-react"
import { setPregatireBackTarget } from "@/lib/pregatire/back-target"

export function ExerseazaPregatireCta() {
  return (
    <Link
      href="/pregatire"
      onClick={() => setPregatireBackTarget("/exerseaza")}
      className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#60a5fa] px-4 py-4 shadow-[0_10px_28px_-12px_rgba(37,99,235,0.55)] transition-transform active:scale-[0.99]"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-white shadow-sm">
        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </span>

      <div className="min-w-0 flex-1 pr-24">
        <p className="text-base font-bold text-white">Pregătire live</p>
        <p className="mt-0.5 text-sm text-white/85">Workshop-uri cu profesori, pe săptămână</p>
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-3 right-0 h-[125%] w-28"
      >
        <Image
          src="/images/exerseaza/pregatiri-icon.png"
          alt=""
          fill
          sizes="112px"
          className="object-contain object-bottom"
          priority
        />
      </span>
    </Link>
  )
}

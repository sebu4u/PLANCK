import Image from "next/image"
import Link from "next/link"
import { Rocket } from "lucide-react"

type FreePlanUpgradeModalProps = {
  imageSrc: string
  onClose: () => void
  ctaHref?: string
}

export function FreePlanUpgradeModal({ imageSrc, onClose, ctaHref = "/pricing" }: FreePlanUpgradeModalProps) {
  return (
    <div className="relative w-full max-w-[460px] rounded-3xl border border-black/10 bg-white px-5 pb-6 pt-32 text-center text-[#0b0b0d] shadow-2xl overflow-visible sm:px-6 sm:pt-36">
      <div className="absolute -top-16 left-0 right-0 px-5 pointer-events-none sm:-top-20 sm:px-6">
        <div className="relative w-full">
          <Image
            src={imageSrc}
            alt="Planck trial"
            width={900}
            height={720}
            className="h-auto w-full"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>

      <div className="mt-2 hidden items-center justify-center gap-2 text-black/80 sm:flex">
        <Rocket className="h-5 w-5 text-black" />
        <span className="text-sm font-semibold tracking-[0.2em]">PLANCK</span>
      </div>

      <h2 className="mt-8 text-xl font-bold leading-tight text-black sm:mt-10 sm:text-2xl">
        Invata fizica mai usor. Note mai mari, fara stres.
      </h2>

      <p className="mt-3 text-[13px] leading-relaxed text-black/70 sm:text-sm">
        Invata mai rapid, ia note mai mari si castiga incredere — la un cost mult mai mic decat o pregatire clasica.
      </p>

      <Link
        href={ctaHref}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-black text-white text-base font-semibold transition hover:bg-black/90 sm:mt-6 sm:h-12"
      >
        Incearca 7 zile
      </Link>

      <button
        type="button"
        onClick={onClose}
        className="mt-3 text-xs font-medium text-black/50 transition hover:text-black/70"
      >
        mai tarziu
      </button>
    </div>
  )
}

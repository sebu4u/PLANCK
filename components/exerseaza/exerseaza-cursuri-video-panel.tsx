import Image from "next/image"
import { Video } from "lucide-react"

const EMPTY_CURSURI_IMAGE_SRC = `/images/icons/${encodeURIComponent("Untitled design (48).png")}`

export function ExerseazaCursuriVideoPanel() {
  return (
    <div className="flex min-h-[min(58dvh,28rem)] w-full flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex w-full max-w-sm flex-col items-center justify-center gap-5">
        <div className="relative">
          <Image
            src={EMPTY_CURSURI_IMAGE_SRC}
            alt=""
            width={120}
            height={120}
            className="mx-auto h-auto w-[min(120px,38vw)] shrink-0 select-none object-contain"
            priority
          />
          <span className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#6b7280]">
            <Video className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#111827]">Cursuri video</h2>
          <p className="mx-auto max-w-md text-center text-base leading-relaxed text-[#374151]">
            Nu există nicio înregistrare a unui curs încă.
          </p>
        </div>
      </div>
    </div>
  )
}

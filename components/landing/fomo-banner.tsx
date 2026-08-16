import { Flame } from "lucide-react"
import {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_YEARLY_RON,
} from "@/lib/landing-campaign"

export function FomoBanner({ days }: { days: number }) {
  return (
    <div className="w-full border-b border-orange-100 bg-gradient-to-r from-[#fff3e6] to-[#fff8f0]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center">
        <Flame className="h-4 w-4 flex-shrink-0 text-orange-500" />
        <p className="text-sm font-semibold text-orange-800">
          Earlybird anual{" "}
          <span className="font-bold text-orange-600">{EARLYBIRD_YEARLY_RON} RON</span>
          {" — până pe "}
          <span className="font-bold text-orange-600">{EARLYBIRD_DEADLINE_LABEL}</span>
          {days > 0 && (
            <>
              {" "}
              — mai sunt{" "}
              <span className="font-bold text-orange-600">
                {days} {days === 1 ? "zi" : "zile"}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

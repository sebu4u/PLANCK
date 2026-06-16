import { Flame } from "lucide-react"
import { getFizicaBacRemainingDays } from "@/lib/invata-fizica-config"

export function FizicaBacCountdown() {
  const remainingDays = getFizicaBacRemainingDays()

  return (
    <p className="mb-4 flex items-center gap-2 text-sm leading-snug text-[#2c2f33]/75">
      <Flame className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
      <span>
        {remainingDays === 0 ? (
          "Azi este proba la Bac"
        ) : (
          <>
            Mai ai{" "}
            <span className="font-bold text-[#0b0c0f]">
              {remainingDays} {remainingDays === 1 ? "zi" : "zile"}
            </span>{" "}
            până la Bac
          </>
        )}
      </span>
    </p>
  )
}

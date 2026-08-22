import { Flame } from "lucide-react"
import { earlybirdSeatsFomoCopy } from "@/lib/landing-campaign"

export function FomoBanner() {
  return (
    <div className="w-full border-b border-orange-100 bg-gradient-to-r from-[#fff3e6] to-[#fff8f0]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center">
        <Flame className="h-4 w-4 flex-shrink-0 text-orange-500" />
        <p className="min-w-0 text-sm font-semibold text-orange-800">
          {earlybirdSeatsFomoCopy()}
        </p>
      </div>
    </div>
  )
}

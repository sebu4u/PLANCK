import { CalendarClock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export function ParentCatalogPage() {
  return (
    <div
      className={cn(
        "min-h-[100dvh] bg-[#f8f9fa] pt-16",
        MOBILE_BOTTOM_NAV_PADDING_CLASS,
        "burger:pb-12",
      )}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl items-center px-4 py-10 md:px-8">
        <Card className="w-full border-[#e5e7eb] bg-white shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center sm:px-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ff] text-[#6366f1]">
              <CalendarClock className="h-7 w-7" aria-hidden />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[#111827]">Catalog</h1>
              <p className="text-sm leading-relaxed text-[#6b7280] sm:text-base">
                Catalogul va fi disponibil începând cu 1 octombrie 2026.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

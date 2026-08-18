import { Loader2 } from "lucide-react"

export default function ShopLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f7fc]">
      <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" aria-label="Se încarcă magazinul" />
    </div>
  )
}

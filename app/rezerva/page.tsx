import { pageTitle } from "@/lib/metadata"
import { RezervaCheckoutPage } from "@/components/landing/rezerva-checkout-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: pageTitle("Rezervă locul"),
  description: "Creează-ți contul și rezervă locul în grupa live cu Premium săptămânal.",
}

export default function RezervaPage() {
  return <RezervaCheckoutPage />
}

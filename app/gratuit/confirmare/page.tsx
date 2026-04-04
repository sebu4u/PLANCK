import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"
import { GratuitConfirmareClient } from "./gratuit-confirmare-client"

export const metadata: Metadata = generateMetadata("gratuit-confirmare")

export default function GratuitConfirmarePage() {
  return <GratuitConfirmareClient />
}

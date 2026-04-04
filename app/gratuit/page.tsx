import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"
import { WebinarSignupForm } from "./webinar-signup-form"

// Avoids static prerender issues with useActionState + server actions on this route.
export const dynamic = "force-dynamic"

export const metadata: Metadata = generateMetadata("gratuit")

export default function GratuitPage() {
  return <WebinarSignupForm />
}

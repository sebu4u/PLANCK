import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

import { StructuredData } from "@/components/structured-data"

export const metadata: Metadata = generateMetadata('sketch')

export default function SketchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Planck Sketch",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "RON"
    },
    "description": "Whiteboard interactiv pentru matematică și fizică, cu grafice și colaborare în timp real."
  }

  return (
    <>
      <StructuredData data={schema} id="software-app-sketch" />
      {children}
    </>
  )
}




























































import { Metadata } from "next"

import { ContactPageClient } from "@/components/contact/contact-page-client"
import { StructuredData } from "@/components/structured-data"
import { generateMetadata } from "@/lib/metadata"
import { breadcrumbStructuredData } from "@/lib/structured-data"

export const metadata: Metadata = generateMetadata("contact")

export default function ContactPage() {
  return (
    <>
      <StructuredData
        data={breadcrumbStructuredData([
          { name: "Acasă", url: "https://www.planck.academy" },
          { name: "Contact", url: "https://www.planck.academy/contact" },
        ])}
        id="breadcrumbs-contact"
      />
      <ContactPageClient />
    </>
  )
}

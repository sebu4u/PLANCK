import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"
import { Footer } from "@/components/footer"
import { DesprePageClient } from "@/components/despre/despre-page-client"
import { aboutPageStructuredData, breadcrumbStructuredData } from "@/lib/structured-data"
import { StructuredData } from "@/components/structured-data"

export const metadata: Metadata = generateMetadata('about')

export default function AboutPage() {
  return (
    <>
      <StructuredData data={aboutPageStructuredData} id="about-page" />
      <StructuredData
        data={breadcrumbStructuredData([
          { name: "Acasă", url: "https://www.planck.academy" },
          { name: "Despre", url: "https://www.planck.academy/despre" },
        ])}
        id="breadcrumbs-despre"
      />
      <DesprePageClient />
      <Footer />
    </>
  )
}

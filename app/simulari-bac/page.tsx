import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { BacSimulationsClient } from "@/components/bac-simulations-client"
import { generateMetadata } from "@/lib/metadata"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import {
    getAllBacSubjectsGrouped,
    getAllBacSubjectsFlat
} from "@/lib/supabase-bac"

export const metadata: Metadata = generateMetadata('bac-simulations')

// Enable SSG with ISR (revalidate every 6 hours)
export const revalidate = 21600

export default async function BacSimulationsPage() {
    // Obținem datele din Supabase
    const yearGroups = await getAllBacSubjectsGrouped()
    const allSubjects = await getAllBacSubjectsFlat()

    // Structured Data: Breadcrumbs
    const breadcrumbs = breadcrumbStructuredData([
        { name: "Acasă", url: "https://www.planck.academy/" },
        { name: "Simulări BAC", url: "https://www.planck.academy/simulari-bac" },
    ])

    return (
        <div className="h-screen overflow-hidden bg-[#101010] text-white">
            <Navigation />

            <div className="pt-16 h-full relative z-10">
                <StructuredData data={breadcrumbs} />
                <BacSimulationsClient
                    yearGroups={yearGroups}
                    allSubjects={allSubjects}
                />
            </div>
        </div>
    )
}

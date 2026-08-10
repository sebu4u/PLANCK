import type { Metadata } from "next"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { generateMetadata as buildMetadata } from "@/lib/metadata"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { CURSURI_SUBJECTS } from "@/lib/cursuri-subjects"

export const metadata: Metadata = {
  ...buildMetadata("physics-lessons"),
  title: "Cursuri text – pe materii | PLANCK",
  description:
    "Cursuri text structurate pe clase, capitole și lecții: fizică, matematică, informatică, chimie și biologie.",
  alternates: {
    canonical: "/invata/cursuri",
  },
}

export const revalidate = 21600

export default function InvataCursuriHubPage() {
  const breadcrumbs = breadcrumbStructuredData([
    { name: "Acasă", url: "https://www.planck.academy/" },
    { name: "Învață", url: "https://www.planck.academy/invata" },
    { name: "Cursuri", url: "https://www.planck.academy/invata/cursuri" },
  ])

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-gray-900 mobile-bottom-nav-pad">
      <StructuredData data={breadcrumbs} />
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        <p className="text-sm uppercase tracking-[0.18em] text-gray-400 mb-3">Învață</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Cursuri text</h1>
        <p className="text-gray-600 max-w-2xl mb-10">
          Alege materia. Fiecare curs e organizat pe clasă, capitol și lecție.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CURSURI_SUBJECTS.map((subject) => {
            const Icon = subject.icon
            return (
              <Link
                key={subject.id}
                href={subject.href}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFD] text-gray-800 border border-gray-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  {subject.label}
                </h2>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{subject.description}</p>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}

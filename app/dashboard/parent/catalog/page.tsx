import type { Metadata } from "next"
import { ParentCatalogPage } from "@/components/dashboard/parent/parent-catalog-page"
import { requireParentUser } from "@/lib/parent/require-parent"

export const metadata: Metadata = {
  title: "Catalog | PLANCK",
  description: "Catalog pentru părinți.",
}

export const dynamic = "force-dynamic"

export default async function ParentCatalogRoutePage() {
  await requireParentUser()
  return <ParentCatalogPage />
}

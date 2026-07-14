import type { Metadata } from "next"
import { ParentCatalogPage } from "@/components/dashboard/parent/parent-catalog-page"
import { requireParentUser } from "@/lib/parent/require-parent"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Catalog părinte"),
  description: "Catalog pentru părinți.",
}

export const dynamic = "force-dynamic"

export default async function ParentCatalogRoutePage() {
  await requireParentUser()
  return <ParentCatalogPage />
}

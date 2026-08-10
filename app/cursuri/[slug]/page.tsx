import { redirect } from "next/navigation"

export default async function CursuriSlugRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/invata/cursuri/fizica/${slug}`)
}

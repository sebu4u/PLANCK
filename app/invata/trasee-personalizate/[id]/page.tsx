import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export const dynamic = "force-dynamic"

type RouteItemRow = {
  id: string
  order_index: number
  source_type: string
  title: string
  reason: string | null
  target_concepts: string[] | null
  snapshot: Record<string, unknown> | null
  learning_path_item_id: string | null
  problem_id: string | null
}

type RouteRow = {
  id: string
  title: string
  prompt: string
  rationale: string | null
  created_at: string
  user_custom_learning_route_items?: RouteItemRow[] | null
}

function itemHref(item: RouteItemRow): string | null {
  const snapshotHref = item.snapshot?.href
  if (typeof snapshotHref === "string" && snapshotHref.startsWith("/")) return snapshotHref
  if (item.source_type === "catalog_problem" && item.problem_id) return `/probleme/${item.problem_id}`
  return null
}

export default async function CustomRouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: route } = await supabase
    .from("user_custom_learning_routes")
    .select("id, title, prompt, rationale, created_at, user_custom_learning_route_items(id, order_index, source_type, title, reason, target_concepts, snapshot, learning_path_item_id, problem_id)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!route) notFound()

  const typedRoute = route as RouteRow
  const items = [...(typedRoute.user_custom_learning_route_items ?? [])].sort(
    (a, b) => a.order_index - b.order_index,
  )

  return (
    <>
      <Navigation />
      <main className={`min-h-screen bg-[#fbfaff] pt-24 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 pb-16 sm:px-8">
          <header className="space-y-3">
            <Link href="/invata/trasee-personalizate" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
              ← Trasee personalizate
            </Link>
            <div className="rounded-[2rem] border border-violet-100 bg-white p-6 shadow-[0_18px_60px_rgba(76,29,149,0.08)]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
                <Sparkles className="h-3.5 w-3.5" />
                generat din greșeli
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">{typedRoute.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-[#655b73] sm:text-base">{typedRoute.rationale}</p>
              <p className="mt-4 rounded-2xl bg-[#fbfaff] p-4 text-sm text-[#4d435c]">Prompt: „{typedRoute.prompt}”</p>
            </div>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#111111]">Pașii recomandați</h2>
            {items.map((item, index) => {
              const href = itemHref(item)
              return (
                <Card key={item.id} className="rounded-3xl border-violet-100 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-3 text-lg text-[#15111f]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {index + 1}
                      </span>
                      <span>{item.title}</span>
                    </CardTitle>
                    <CardDescription>{item.source_type.replaceAll("_", " ")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.reason ? <p className="text-sm leading-relaxed text-[#5f566d]">{item.reason}</p> : null}
                    {item.target_concepts?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {item.target_concepts.map((concept) => (
                          <span key={concept} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            {concept}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {href ? (
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                      >
                        Deschide pasul
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Folosește acest pas ca recapitulare înainte să continui.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </section>
        </div>
      </main>
    </>
  )
}

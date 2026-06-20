import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { CustomRouteGeneratorForm } from "@/components/invata/custom-route-generator-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export const dynamic = "force-dynamic"

type RouteRow = {
  id: string
  title: string
  prompt: string
  rationale: string | null
  created_at: string
  user_custom_learning_route_items?: { id: string }[] | null
}

export default async function CustomRoutesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: routes } = await supabase
    .from("user_custom_learning_routes")
    .select("id, title, prompt, rationale, created_at, user_custom_learning_route_items(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <>
      <Navigation />
      <main className={`min-h-screen bg-[#fbfaff] pt-24 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 pb-16 sm:px-8">
          <header className="space-y-3">
            <Link href="/invata" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
              ← Înapoi la trasee
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  Trasee personalizate
                </h1>
                <p className="mt-1 text-sm text-[#6d6477] sm:text-base">
                  PLANCK folosește greșelile salvate din probleme și teste pentru a-ți construi un traseu de recuperare.
                </p>
              </div>
            </div>
          </header>

          <CustomRouteGeneratorForm />

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#111111]">Traseele tale recente</h2>
            {(routes as RouteRow[] | null)?.length ? (
              <div className="grid gap-4">
                {(routes as RouteRow[]).map((route) => {
                  const itemCount = route.user_custom_learning_route_items?.length ?? 0
                  return (
                    <Card key={route.id} className="rounded-3xl border-violet-100 bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg text-[#15111f]">{route.title}</CardTitle>
                        <CardDescription>{itemCount} pași · creat din promptul „{route.prompt}”</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {route.rationale ? <p className="text-sm leading-relaxed text-[#5f566d]">{route.rationale}</p> : null}
                        <Link
                          href={`/invata/trasee-personalizate/${route.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                        >
                          Deschide traseul
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="rounded-3xl border-dashed border-violet-200 bg-white/70">
                <CardContent className="p-6 text-sm text-[#6d6477]">
                  Nu ai încă trasee personalizate. Scrie un prompt mai sus și generăm unul din greșelile tale.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

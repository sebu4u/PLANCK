import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthenticatedSupabase } from "@/lib/learning-path-flashcard-auth"
import {
  buildCustomRouteCandidates,
  getUserMistakeProfile,
  makeCustomRouteRationale,
  makeCustomRouteTitle,
  persistCustomRoute,
} from "@/lib/learning-mistakes/custom-routes"

const generateRouteSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
})

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request)
  if ("error" in auth) return auth.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = generateRouteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Scrie un prompt de cel puțin 3 caractere." }, { status: 400 })
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await auth.supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }

    const prompt = parsed.data.prompt
    const profile = await getUserMistakeProfile(auth.supabase, 120)
    const items = await buildCustomRouteCandidates(auth.supabase, prompt, profile)
    const title = makeCustomRouteTitle(prompt, profile.concepts)
    const rationale = makeCustomRouteRationale(prompt, profile, items)
    const route = await persistCustomRoute(auth.supabase, {
      userId: user.id,
      prompt,
      title,
      rationale,
      items,
    })

    return NextResponse.json({ route })
  } catch (error) {
    console.error("generate custom route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut genera traseul." },
      { status: 500 },
    )
  }
}

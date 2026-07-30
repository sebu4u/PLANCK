import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

async function requireUser(req: NextRequest) {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(token)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const supabase = createServerClientWithToken(token)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  return { supabase, user: data.user }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req)
    if ("error" in auth) return auth.error

    const parsed = subscribeSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Subscription invalidă." }, { status: 400 })
    }

    const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null
    const { error } = await auth.supabase.from("push_subscriptions").upsert(
      {
        user_id: auth.user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

    if (error) {
      logger.error("[pregatire/push] subscribe failed:", error)
      return NextResponse.json({ error: "Nu am putut salva notificările." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("[pregatire/push] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser(req)
    if ("error" in auth) return auth.error

    const body = await req.json().catch(() => ({}))
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : null
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint obligatoriu." }, { status: 400 })
    }

    const { error } = await auth.supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("endpoint", endpoint)

    if (error) {
      logger.error("[pregatire/push] unsubscribe failed:", error)
      return NextResponse.json({ error: "Nu am putut dezactiva notificările." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("[pregatire/push] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

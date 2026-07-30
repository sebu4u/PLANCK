import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const teacherSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(""),
  icon_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
})

async function verifyAdmin(req: NextRequest) {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(token)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const client = createServerClientWithToken(token)
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(client, data.user))) {
    return {
      error: NextResponse.json(
        { error: "Acces interzis. Doar adminii pot administra profesorii." },
        { status: 403 },
      ),
    }
  }
  return { user: data.user }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const supabase = getServiceRoleSupabase()
    const { data, error } = await supabase
      .from("workshop_teachers")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      logger.error("[admin/workshop-teachers] GET failed:", error)
      return NextResponse.json({ error: "Nu am putut încărca profesorii." }, { status: 500 })
    }

    return NextResponse.json({ teachers: data ?? [] })
  } catch (err) {
    logger.error("[admin/workshop-teachers] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const parsed = teacherSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Date invalide." },
        { status: 400 },
      )
    }

    const supabase = getServiceRoleSupabase()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("workshop_teachers")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description,
        icon_url: parsed.data.icon_url ?? null,
        is_active: parsed.data.is_active,
        updated_at: now,
      })
      .select("*")
      .single()

    if (error) {
      logger.error("[admin/workshop-teachers] POST failed:", error)
      return NextResponse.json({ error: "Nu am putut crea profesorul." }, { status: 500 })
    }

    return NextResponse.json({ teacher: data }, { status: 201 })
  } catch (err) {
    logger.error("[admin/workshop-teachers] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const parsed = teacherSchema.safeParse(await req.json())
    if (!parsed.success || !parsed.data.id) {
      return NextResponse.json(
        { error: parsed.success ? "ID-ul este obligatoriu." : (parsed.error.issues[0]?.message ?? "Date invalide.") },
        { status: 400 },
      )
    }

    const supabase = getServiceRoleSupabase()
    const { data, error } = await supabase
      .from("workshop_teachers")
      .update({
        name: parsed.data.name,
        description: parsed.data.description,
        icon_url: parsed.data.icon_url ?? null,
        is_active: parsed.data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .select("*")
      .single()

    if (error) {
      logger.error("[admin/workshop-teachers] PUT failed:", error)
      return NextResponse.json({ error: "Nu am putut actualiza profesorul." }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Profesorul nu a fost găsit." }, { status: 404 })
    }

    return NextResponse.json({ teacher: data })
  } catch (err) {
    logger.error("[admin/workshop-teachers] PUT error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const id = new URL(req.url).searchParams.get("id")?.trim()
    if (!id) {
      return NextResponse.json({ error: "ID-ul este obligatoriu." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()
    const { count } = await supabase
      .from("workshops")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", id)

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Profesorul are pregătiri asociate. Dezactivează-l în loc să-l ștergi." },
        { status: 409 },
      )
    }

    const { error } = await supabase.from("workshop_teachers").delete().eq("id", id)
    if (error) {
      logger.error("[admin/workshop-teachers] DELETE failed:", error)
      return NextResponse.json({ error: "Nu am putut șterge profesorul." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("[admin/workshop-teachers] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

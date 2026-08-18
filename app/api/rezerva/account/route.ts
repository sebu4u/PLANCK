import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"

const bodySchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere.").max(72),
})

function isEmailTakenError(error: { message?: string; status?: number; code?: string } | null): boolean {
  if (!error) return false
  const message = (error.message ?? "").toLowerCase()
  const code = (error.code ?? "").toLowerCase()
  return (
    error.status === 422 ||
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("already exists")
  )
}

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { error: "Introdu un email valid și o parolă de cel puțin 8 caractere." },
      { status: 400 },
    )
  }

  try {
    const admin = getServiceRoleSupabase()
    const { error } = await admin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
      user_metadata: { user_type: "elev" },
    })

    if (error && !isEmailTakenError(error)) {
      logger.error("[rezerva/account] createUser failed:", error)
      return NextResponse.json({ error: "Nu am putut crea contul. Încearcă din nou." }, { status: 500 })
    }

    return NextResponse.json({ ok: true, created: !error })
  } catch (error) {
    logger.error("[rezerva/account] unexpected error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

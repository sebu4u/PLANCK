import { NextRequest, NextResponse } from "next/server"

import { unsubscribeSubscriber } from "@/lib/mailerlite/client"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("marketing_emails_opt_out")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    marketing_emails_opt_out: profile?.marketing_emails_opt_out === true,
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { opt_out?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (typeof body.opt_out !== "boolean") {
    return NextResponse.json({ error: "opt_out must be a boolean" }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ marketing_emails_opt_out: body.opt_out })
    .eq("user_id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (body.opt_out && process.env.MAILERLITE_API_KEY) {
    try {
      await unsubscribeSubscriber(user.email)
    } catch (error) {
      console.warn("[marketing-emails] MailerLite unsubscribe sync failed:", error)
    }
  }

  return NextResponse.json({ marketing_emails_opt_out: body.opt_out })
}

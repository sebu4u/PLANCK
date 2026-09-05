"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { upsertSubscriber } from "@/lib/mailerlite/client"
import { logger } from "@/lib/logger"
import { PLANCK_WEEK_MOBILE_CALENDAR_FROM, PLANCK_WEEK_MOBILE_CALENDAR_TO } from "@/lib/planck-week"
import { isWorkshopSubject, WORKSHOP_SUBJECTS, type WorkshopSubject } from "@/lib/pregatire/types"
import { createClient } from "@/lib/supabase/server"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export type PlanckWeekLeadActionState = {
  error: string | null
  fieldErrors?: Partial<Record<"name" | "email" | "subjects", string>>
}

const planckWeekLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Introdu numele complet.")
    .max(80, "Numele e prea lung."),
  email: z.string().trim().email("Introdu un email valid."),
  subjects: z
    .array(z.string())
    .min(1, "Alege cel puțin o materie.")
    .superRefine((values, ctx) => {
      if (!values.every(isWorkshopSubject)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Alege cel puțin o materie validă.",
        })
      }
    }),
})

function firstFieldError(
  flat: Record<string, string[] | undefined>,
  key: "name" | "email" | "subjects",
): string | undefined {
  return flat[key]?.[0]
}

export type PlanckWeekSubjectSeat = {
  remaining: number
  max: number
}

export type PlanckWeekSubjectSeats = Partial<Record<WorkshopSubject, PlanckWeekSubjectSeat>>

export async function getPlanckWeekSubjectSeats(): Promise<PlanckWeekSubjectSeats> {
  const from = `${PLANCK_WEEK_MOBILE_CALENDAR_FROM}T00:00:00+03:00`
  const to = `${PLANCK_WEEK_MOBILE_CALENDAR_TO}T23:59:59+03:00`

  try {
    const supabase = getServiceRoleSupabase()
    const { data, error } = await supabase
      .from("workshops_public")
      .select("subject, max_seats, unlock_count, starts_at")
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true })

    if (error) {
      logger.error("[planck-week] seats query failed:", error.message)
      return {}
    }

    const seats: PlanckWeekSubjectSeats = {}
    for (const row of data ?? []) {
      if (!isWorkshopSubject(row.subject) || seats[row.subject]) continue
      if (row.max_seats == null) continue
      const max = Number(row.max_seats)
      const taken = Number(row.unlock_count ?? 0)
      seats[row.subject] = {
        max,
        remaining: Math.max(0, max - taken),
      }
    }
    return seats
  } catch (err) {
    logger.error("[planck-week] seats query error:", err)
    return {}
  }
}

export async function submitPlanckWeekLead(
  _prev: PlanckWeekLeadActionState,
  formData: FormData,
): Promise<PlanckWeekLeadActionState> {
  const honeypot = String(formData.get("company") ?? "").trim()
  const subjects = formData
    .getAll("subjects")
    .map((value) => String(value))
    .filter((value) => (WORKSHOP_SUBJECTS as readonly string[]).includes(value))

  if (honeypot) {
    redirect("/planck-week/confirmare")
  }

  const parsed = planckWeekLeadSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    subjects,
  })

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors
    const fieldErrors: PlanckWeekLeadActionState["fieldErrors"] = {}
    const nameError = firstFieldError(flat, "name")
    const emailError = firstFieldError(flat, "email")
    const subjectsError = firstFieldError(flat, "subjects")
    if (nameError) fieldErrors.name = nameError
    if (emailError) fieldErrors.email = emailError
    if (subjectsError) fieldErrors.subjects = subjectsError

    return {
      error: parsed.error.errors[0]?.message ?? "Verifică câmpurile și încearcă din nou.",
      fieldErrors,
    }
  }

  const email = parsed.data.email.toLowerCase()
  const seats = await getPlanckWeekSubjectSeats()
  const fullSubjects = parsed.data.subjects.filter((subject) => seats[subject]?.remaining === 0)
  if (fullSubjects.length > 0) {
    return {
      error: "Nu mai sunt locuri la una dintre materiile alese. Alege altă materie.",
      fieldErrors: { subjects: "Nu mai sunt locuri la una dintre materiile alese." },
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("planck_week_leads").insert({
    name: parsed.data.name,
    email,
    subjects: parsed.data.subjects,
  })

  if (error) {
    logger.error("[planck-week] lead insert failed:", error.message)
    return {
      error:
        "Nu am putut rezerva locul. Încearcă din nou peste câteva minute sau scrie-ne la contact@planck.academy.",
    }
  }

  const groupId = process.env.MAILERLITE_PLANCK_WEEK_GROUP_ID?.trim()
  if (groupId) {
    try {
      await upsertSubscriber(email, {
        fields: { name: parsed.data.name },
        groups: [groupId],
      })
    } catch {
      // Reservation already saved — MailerLite is optional.
    }
  }

  const materii = parsed.data.subjects.join(",")
  redirect(`/planck-week/confirmare?materii=${encodeURIComponent(materii)}`)
}

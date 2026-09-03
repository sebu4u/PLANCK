"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { upsertSubscriber } from "@/lib/mailerlite/client"
import { isWorkshopSubject, WORKSHOP_SUBJECTS } from "@/lib/pregatire/types"
import { createClient } from "@/lib/supabase/server"

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
  const supabase = await createClient()
  const { error } = await supabase.from("planck_week_leads").insert({
    name: parsed.data.name,
    email,
    subjects: parsed.data.subjects,
  })

  if (error) {
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

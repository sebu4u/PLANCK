"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import {
  WEBINAR_CLASA_OPTIONS,
  WEBINAR_METODA_OPTIONS,
  WEBINAR_NOTA_OPTIONS,
  type WebinarLeadActionState,
} from "./webinar-options"

const webinarLeadSchema = z.object({
  clasa: z.enum(WEBINAR_CLASA_OPTIONS),
  nota_tintita: z.enum(WEBINAR_NOTA_OPTIONS),
  metoda_pregatire: z.enum(WEBINAR_METODA_OPTIONS),
  provocare: z.string().trim().min(1, "Completează răspunsul."),
  instrument_ideal: z.string().trim().min(1, "Completează răspunsul."),
  email: z.string().trim().email("Introdu un email valid."),
  telefon: z
    .string()
    .trim()
    .min(8, "Introdu un număr de telefon valid."),
})

export async function submitWebinarLead(
  _prev: WebinarLeadActionState,
  formData: FormData
): Promise<WebinarLeadActionState> {
  const raw = {
    clasa: formData.get("clasa") ?? "",
    nota_tintita: formData.get("nota_tintita") ?? "",
    metoda_pregatire: formData.get("metoda_pregatire") ?? "",
    provocare: formData.get("provocare") ?? "",
    instrument_ideal: formData.get("instrument_ideal") ?? "",
    email: formData.get("email") ?? "",
    telefon: formData.get("telefon") ?? "",
  }

  const parsed = webinarLeadSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {}
    const flat = parsed.error.flatten().fieldErrors
    if (flat.clasa?.[0]) fieldErrors.clasa = flat.clasa[0]
    if (flat.nota_tintita?.[0]) fieldErrors.nota_tintita = flat.nota_tintita[0]
    if (flat.metoda_pregatire?.[0]) fieldErrors.metoda_pregatire = flat.metoda_pregatire[0]
    if (flat.provocare?.[0]) fieldErrors.provocare = flat.provocare[0]
    if (flat.instrument_ideal?.[0]) fieldErrors.instrument_ideal = flat.instrument_ideal[0]
    if (flat.email?.[0]) fieldErrors.email = flat.email[0]
    if (flat.telefon?.[0]) fieldErrors.telefon = flat.telefon[0]

    const first =
      parsed.error.errors[0]?.message ?? "Verifică câmpurile și încearcă din nou."
    return { error: first, fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("webinar_leads").insert({
    clasa: parsed.data.clasa,
    nota_tintita: parsed.data.nota_tintita,
    metoda_pregatire: parsed.data.metoda_pregatire,
    provocare: parsed.data.provocare,
    instrument_ideal: parsed.data.instrument_ideal,
    email: parsed.data.email,
    telefon: parsed.data.telefon,
  })

  if (error) {
    return {
      error:
        "Nu am putut trimite înscrierea. Încearcă din nou peste câteva minute sau scrie-ne la contact@planck.academy.",
    }
  }

  redirect("/gratuit/confirmare")
}

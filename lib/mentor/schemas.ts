import { z } from "zod"
import {
  WORKSHOP_DEFAULT_DURATION_MINUTES,
  WORKSHOP_DEFAULT_ENERGY_COST,
  WORKSHOP_HOMEWORK_ITEM_TYPES,
  WORKSHOP_SUBJECTS,
} from "@/lib/pregatire/types"

export const homeworkItemSchema = z.object({
  item_type: z.enum(WORKSHOP_HOMEWORK_ITEM_TYPES),
  ref_id: z.string().trim().min(1).max(180),
  title: z.string().trim().min(1).max(300),
  href: z.string().trim().min(1).max(500),
})

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null || value === "") return null
    return value
  })
  .refine((value) => value == null || /^https?:\/\//i.test(value), {
    message: "URL-ul tablei trebuie să înceapă cu http(s).",
  })

const optionalPath = z
  .string()
  .trim()
  .max(512)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null || value === "") return null
    return value
  })

export const mentorCreateWorkshopSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(5000).default(""),
  subject: z.enum(WORKSHOP_SUBJECTS),
  starts_at: z.string().trim().min(1),
  duration_minutes: z.number().int().min(15).max(480).default(WORKSHOP_DEFAULT_DURATION_MINUTES),
  energy_cost: z.number().int().min(1).max(500).default(WORKSHOP_DEFAULT_ENERGY_COST),
  meet_url: z.string().url(),
  max_seats: z.number().int().min(1).max(10000).nullable().optional(),
  is_published: z.boolean().default(false),
  is_bac: z.boolean().default(false),
})

export const mentorPatchWorkshopSchema = z.object({
  meet_url: z.string().url().optional(),
  whiteboard_url: optionalUrl,
  notes_markdown: z.string().max(100_000).optional().nullable(),
  notes_pdf_path: optionalPath,
  homework_pdf_path: optionalPath,
  homework_items: z.array(homeworkItemSchema).max(80).optional(),
})

export function normalizeStartsAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_starts_at")
  }
  return date.toISOString()
}

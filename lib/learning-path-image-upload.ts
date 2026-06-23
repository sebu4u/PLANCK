import "server-only"

import { z } from "zod"
import { createAdminClient } from "@/lib/supabaseAdmin"

export const LEARNING_PATH_IMAGES_BUCKET = "lesson-images"
const OFFICIAL_PREFIX = "official/"

export const learningPathImageUploadSchema = z.object({
  kind: z.enum(["chapter", "lesson"]),
  id: z.string().uuid(),
})

export type LearningPathImageUploadInput = z.infer<typeof learningPathImageUploadSchema>

export const learningPathImageDeleteSchema = z.object({
  path: z.string().min(1).max(512),
})

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
])

const MAGIC_BYTE_CHECKS: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
]

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
}

export const MAX_LEARNING_PATH_IMAGE_BYTES = 4 * 1024 * 1024

export type ValidatedImage = {
  bytes: Buffer
  contentType: string
  extension: string
}

export function validateLearningPathImage(file: File): ValidatedImage {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Tipul de fișier nu este permis. Folosește JPEG, PNG, WebP, GIF sau SVG.")
  }
  if (file.size > MAX_LEARNING_PATH_IMAGE_BYTES) {
    throw new Error("Fișierul este prea mare (maxim 4 MB).")
  }
  if (file.size === 0) {
    throw new Error("Fișierul este gol.")
  }
  return {
    bytes: Buffer.alloc(0),
    contentType: file.type,
    extension: EXT_BY_MIME[file.type] ?? "bin",
  }
}

export async function readAndValidateLearningPathImage(file: File): Promise<ValidatedImage> {
  const meta = validateLearningPathImage(file)
  const buf = Buffer.from(await file.arrayBuffer())
  if (file.type !== "image/svg+xml") {
    const head = buf.subarray(0, 4)
    const matched = MAGIC_BYTE_CHECKS.some(({ bytes }) =>
      bytes.every((b, i) => head[i] === b),
    )
    if (!matched) {
      throw new Error("Conținutul fișierului nu se potrivește cu tipul declarat.")
    }
  }
  return { ...meta, bytes: buf }
}

export function buildChapterCoverPath(chapterId: string, extension: string): string {
  return `${OFFICIAL_PREFIX}${chapterId}/cover.${extension}`
}

export async function buildLessonCoverPath(
  lessonId: string,
  extension: string,
): Promise<string> {
  const admin = createAdminClient()
  const { data: lesson, error } = await admin
    .from("learning_path_lessons")
    .select("chapter_id")
    .eq("id", lessonId)
    .maybeSingle()
  if (error || !lesson?.chapter_id) {
    throw new Error("Lecția nu a fost găsită.")
  }
  return `${OFFICIAL_PREFIX}${lesson.chapter_id}/lessons/${lessonId}.${extension}`
}

export function isOfficialPath(path: string): boolean {
  return path.startsWith(OFFICIAL_PREFIX)
}

export async function uploadLearningPathImage(
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(LEARNING_PATH_IMAGES_BUCKET)
    .upload(path, bytes, {
      contentType,
      cacheControl: "31536000, immutable",
      upsert: true,
    })
  if (error) {
    throw new Error(`Upload eșuat: ${error.message}`)
  }
  const { data } = admin.storage.from(LEARNING_PATH_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteLearningPathImage(path: string): Promise<void> {
  if (!isOfficialPath(path)) return
  const admin = createAdminClient()
  await admin.storage.from(LEARNING_PATH_IMAGES_BUCKET).remove([path])
}

export function extractStoragePathFromPublicUrl(
  publicUrl: string,
  bucket: string = LEARNING_PATH_IMAGES_BUCKET,
): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    return publicUrl.slice(idx + marker.length)
  } catch {
    return null
  }
}

/** No progress update for this long → treat generation as abandoned. */
export const PERSONALIZED_GENERATION_STALE_MS = 20 * 60 * 1000

/** Hard cap from chapter creation, even if progress ticks occasionally. */
export const PERSONALIZED_GENERATION_MAX_CREATING_MS = 45 * 60 * 1000

export const PERSONALIZED_GENERATION_STALE_REASON =
  "Generarea a expirat fără progres recent. Poți încerca din nou."

type GenerationMetadata = Record<string, unknown> | null | undefined

function readProgressUpdatedAt(metadata: GenerationMetadata): number | null {
  const progress = metadata?.progress
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) return null
  const updatedAt = (progress as { updatedAt?: unknown }).updatedAt
  if (typeof updatedAt !== "string") return null
  const parsed = Date.parse(updatedAt)
  return Number.isFinite(parsed) ? parsed : null
}

export function getPersonalizedGenerationStaleReason(input: {
  createdAt: string | null | undefined
  generationMetadata?: GenerationMetadata
  now?: number
}): string | null {
  const createdMs = input.createdAt ? Date.parse(input.createdAt) : Number.NaN
  if (!Number.isFinite(createdMs)) return null

  const now = input.now ?? Date.now()
  const progressUpdatedMs = readProgressUpdatedAt(input.generationMetadata)
  const lastActivityMs = progressUpdatedMs ?? createdMs

  if (now - lastActivityMs >= PERSONALIZED_GENERATION_STALE_MS) {
    return PERSONALIZED_GENERATION_STALE_REASON
  }

  if (now - createdMs >= PERSONALIZED_GENERATION_MAX_CREATING_MS) {
    return PERSONALIZED_GENERATION_STALE_REASON
  }

  return null
}

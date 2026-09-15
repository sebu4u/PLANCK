/** Filenames only (e.g. cover-1.svg), sorted for stable UI. */
export const CLASSROOM_COVER_FILENAMES = [
  "80071edc-94fc-497e-9eb9-f98ce9a55403.webp",
  "cover-1.svg",
  "cover-2.svg",
  "cover-3.svg",
  "d80344f4-9b02-4e2b-954a-290a53e09c1c.webp",
  "e5edf1af-4f04-4745-86f2-c1270369a530.webp",
  "eb06ab11-695c-4fb0-9670-6b6d6cbe7bf3.webp",
  "ff84cab7-55d1-4c71-b3f7-b46b4061b47a.webp",
] as const

const COVER_SET = new Set<string>(CLASSROOM_COVER_FILENAMES)

export async function listClassroomCoverFilenames(): Promise<string[]> {
  return [...CLASSROOM_COVER_FILENAMES]
}

export function classroomCoverPublicPath(filename: string): string {
  return `/clase/${filename}`
}

/** Map stored DB paths (legacy `.jpg`) onto the current WebP files. */
export function resolveClassroomCoverSrc(storedPath: string | null | undefined): string | null {
  if (!storedPath) return null
  const name = storedPath.startsWith("/clase/") ? storedPath.slice("/clase/".length) : storedPath
  if (COVER_SET.has(name)) return `/clase/${name}`
  const webpName = name.replace(/\.jpe?g$/i, ".webp")
  if (COVER_SET.has(webpName)) return `/clase/${webpName}`
  return storedPath
}

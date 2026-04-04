import { readdir } from "fs/promises"
import path from "path"

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"])

/** Filenames only (e.g. cover-1.svg), sorted for stable UI. */
export async function listClassroomCoverFilenames(): Promise<string[]> {
  const coversDirectory = path.join(process.cwd(), "public", "clase")

  try {
    const files = await readdir(coversDirectory, { withFileTypes: true })
    return files
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "en"))
  } catch {
    return []
  }
}

export function classroomCoverPublicPath(filename: string): string {
  return `/clase/${filename}`
}

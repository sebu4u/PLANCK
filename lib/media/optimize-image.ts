import "server-only"

import sharp from "sharp"

export const IMAGE_PRESETS = {
  chapter: { maxPx: 512, quality: 80, fit: "inside" as const },
  lesson: { maxPx: 128, quality: 80, fit: "inside" as const },
  item: { maxPx: 1600, quality: 82, fit: "inside" as const },
  teacher: { maxPx: 128, quality: 80, fit: "inside" as const },
  cosmetic: { maxPx: 256, quality: 80, fit: "inside" as const },
  avatar: { maxPx: 256, quality: 80, fit: "cover" as const },
} as const

export type ImagePreset = keyof typeof IMAGE_PRESETS

export type OptimizedImage = {
  bytes: Buffer
  contentType: string
  extension: string
  transformed: boolean
}

const PASSTHROUGH_MIME = new Set(["image/svg+xml"])

function extensionForPassthrough(mime: string): string {
  if (mime === "image/svg+xml") return "svg"
  if (mime === "image/gif") return "gif"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg"
  return "bin"
}

export async function optimizeImage(
  input: Buffer,
  contentType: string,
  preset: ImagePreset,
): Promise<OptimizedImage> {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream"
  if (PASSTHROUGH_MIME.has(mime)) {
    return {
      bytes: input,
      contentType: mime,
      extension: extensionForPassthrough(mime),
      transformed: false,
    }
  }

  const meta = await sharp(input, { animated: true, failOn: "none" }).metadata()
  if (mime === "image/gif" && (meta.pages ?? 1) > 1) {
    return {
      bytes: input,
      contentType: "image/gif",
      extension: "gif",
      transformed: false,
    }
  }

  const spec = IMAGE_PRESETS[preset]
  const resize =
    spec.fit === "cover"
      ? {
          width: spec.maxPx,
          height: spec.maxPx,
          fit: "cover" as const,
          withoutEnlargement: true,
        }
      : {
          width: spec.maxPx,
          height: spec.maxPx,
          fit: "inside" as const,
          withoutEnlargement: true,
        }

  const bytes = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(resize)
    .webp({ quality: spec.quality, effort: 4 })
    .toBuffer()

  return {
    bytes,
    contentType: "image/webp",
    extension: "webp",
    transformed: true,
  }
}

export function optimizedStoragePath(originalPath: string, extension: string): string {
  const trimmed = originalPath.replace(/\/+$/, "")
  const slash = trimmed.lastIndexOf("/")
  const fileName = slash >= 0 ? trimmed.slice(slash + 1) : trimmed
  const dir = slash >= 0 ? trimmed.slice(0, slash + 1) : ""
  const withoutQuery = fileName.split("?")[0]
  const withoutExt = withoutQuery.replace(/\.[A-Za-z0-9]+$/, "")
  const nextName = `${withoutExt || withoutQuery}.${extension}`
  if (nextName === withoutQuery) {
    return `${dir}${withoutExt}.opt.${extension}`
  }
  return `${dir}${nextName}`
}

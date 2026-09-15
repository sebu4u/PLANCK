// Re-encode oversized files under public/themes, public/images, public/ranks,
// and public/clase to WebP, then delete the originals. Rank PNGs that already
// have a WebP sibling are deleted without re-encoding.
//
// Usage (from the Next app root, PLANCK/PLANCK):
//   pnpm optimize-public-assets

import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import { optimizeImage } from "@/lib/media/optimize-image"

const PUBLIC_ROOT = path.join(process.cwd(), "public")
const MIN_BYTES = 300 * 1024
const CONVERT_EXT = new Set([".jpg", ".jpeg", ".png"])
const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
}

const TARGET_DIRS = [
  { relative: "themes", convertAll: true },
  { relative: "images", convertAll: false },
  { relative: "clase", convertAll: false },
]

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)))
    } else if (entry.isFile()) {
      files.push(full)
    }
  }
  return files
}

function mimeFor(ext) {
  return MIME_BY_EXT[ext] ?? "application/octet-stream"
}

async function convertFile(filePath, convertAll) {
  const ext = path.extname(filePath).toLowerCase()
  if (!CONVERT_EXT.has(ext)) return { status: "skip", reason: "ext" }

  const info = await stat(filePath)
  if (!convertAll && info.size < MIN_BYTES) {
    return { status: "skip", reason: "small", bytes: info.size }
  }

  const input = await readFile(filePath)
  const optimized = await optimizeImage(input, mimeFor(ext), "catalog")
  const outPath = filePath.replace(/\.[^.]+$/, ".webp")
  await writeFile(outPath, optimized.bytes)
  if (outPath !== filePath) {
    await unlink(filePath)
  }

  return {
    status: "ok",
    from: path.relative(PUBLIC_ROOT, filePath),
    to: path.relative(PUBLIC_ROOT, outPath),
    before: info.size,
    after: optimized.bytes.length,
  }
}

async function deleteRankPngDuplicates() {
  const ranksDir = path.join(PUBLIC_ROOT, "ranks")
  const files = await readdir(ranksDir)
  const names = new Set(files)
  const deleted = []
  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (ext !== ".png") continue
    const webp = `${file.slice(0, -ext.length)}.webp`
    if (!names.has(webp)) continue
    await unlink(path.join(ranksDir, file))
    deleted.push(path.join("ranks", file))
  }
  return deleted
}

const report = []
let ok = 0
let skip = 0
let fail = 0

for (const target of TARGET_DIRS) {
  const dir = path.join(PUBLIC_ROOT, target.relative)
  const files = await walkFiles(dir)
  for (const filePath of files) {
    try {
      const result = await convertFile(filePath, target.convertAll)
      if (result.status === "ok") {
        ok += 1
        report.push(
          `${result.from} → ${result.to} (${(result.before / 1024 / 1024).toFixed(2)}MB → ${(result.after / 1024).toFixed(0)}KB)`,
        )
      } else {
        skip += 1
      }
    } catch (error) {
      fail += 1
      report.push(`FAIL ${path.relative(PUBLIC_ROOT, filePath)}: ${error instanceof Error ? error.message : error}`)
    }
  }
}

const deletedRanks = await deleteRankPngDuplicates()
for (const file of deletedRanks) {
  report.push(`deleted duplicate ${file}`)
}

console.log(report.join("\n"))
console.log(`\nok=${ok} skip=${skip} fail=${fail} rankPngDeleted=${deletedRanks.length}`)
if (fail > 0) process.exit(1)

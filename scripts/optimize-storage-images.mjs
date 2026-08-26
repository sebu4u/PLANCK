// Re-encode oversized public Storage images (covers, lesson thumbs, teacher
// icons, PLANCKPASS cosmetics, avatars) to WebP and update DB URLs.
// Lesson *item* diagrams are left untouched.
//
// Usage (from the Next app root, PLANCK/PLANCK):
//   node --experimental-strip-types \
//        --import ./.agents/skills/planck-personalized-courses/scripts/register.mjs \
//        --env-file=.env.local \
//        scripts/optimize-storage-images.mjs [--dry-run] [--limit=N]
//
// `--dry-run` logs planned writes without uploading, updating, or deleting.

import { createAdminClient } from "@/lib/supabaseAdmin"
import { optimizeImage, optimizedStoragePath } from "@/lib/media/optimize-image"

const dryRun = process.argv.includes("--dry-run")
const limitArg = process.argv.find((a) => a.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : Infinity

const SKIP_MAX_BYTES = {
  chapter: 100_000,
  lesson: 30_000,
  teacher: 20_000,
  cosmetic: 50_000,
  avatar: 80_000,
}

const report = []
const counters = {
  ok: 0,
  skip: 0,
  fail: 0,
}

function extractStoragePathFromPublicUrl(publicUrl, bucket) {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split("?")[0])
}

function isSupabaseUrl(url) {
  if (!url) return false
  try {
    const host = new URL(url).hostname
    return host === "supabase.co" || host.endsWith(".supabase.co") || host.endsWith(".supabase.in")
  } catch {
    return false
  }
}

async function optimizeOne({
  admin,
  kind,
  id,
  idColumn,
  table,
  column,
  bucket,
  preset,
  url,
  title,
}) {
  if (!url) return { status: "skip", reason: "empty url" }
  if (!isSupabaseUrl(url)) return { status: "skip", reason: "non-supabase host" }

  const oldPath = extractStoragePathFromPublicUrl(url.split("?")[0], bucket)
  if (!oldPath) return { status: "skip", reason: "not a public storage url" }

  const { data: blob, error: dlErr } = await admin.storage.from(bucket).download(oldPath)
  if (dlErr || !blob) {
    return { status: "fail", reason: `download: ${dlErr?.message ?? "empty"}` }
  }

  const input = Buffer.from(await blob.arrayBuffer())
  const contentType = blob.type || "image/jpeg"
  if (input.length < 32) return { status: "fail", reason: "file too small" }

  const skipMax = SKIP_MAX_BYTES[preset]
  if (
    skipMax &&
    contentType.includes("webp") &&
    input.length <= skipMax
  ) {
    return { status: "skip", reason: `already small webp (${input.length} B)` }
  }

  let optimized
  try {
    optimized = await optimizeImage(input, contentType, preset)
  } catch (err) {
    return { status: "fail", reason: `optimize: ${err instanceof Error ? err.message : String(err)}` }
  }

  if (!optimized.transformed) {
    return { status: "skip", reason: `passthrough ${optimized.contentType}` }
  }

  if (optimized.bytes.length >= input.length * 0.9 && contentType.includes("webp")) {
    return {
      status: "skip",
      reason: `webp already compact (${input.length} → ${optimized.bytes.length} B)`,
    }
  }

  const newPath = optimizedStoragePath(oldPath, optimized.extension)
  const summary = {
    oldPath,
    newPath,
    oldBytes: input.length,
    newBytes: optimized.bytes.length,
  }

  if (dryRun) {
    return { status: "ok", reason: "dry-run", ...summary }
  }

  const { error: uploadErr } = await admin.storage.from(bucket).upload(newPath, optimized.bytes, {
    contentType: optimized.contentType,
    cacheControl: "31536000, immutable",
    upsert: true,
  })
  if (uploadErr) {
    return { status: "fail", reason: `upload: ${uploadErr.message}` }
  }

  const { data: pub } = admin.storage.from(bucket).getPublicUrl(newPath)
  const newUrl = pub.publicUrl

  const { error: updateErr } = await admin
    .from(table)
    .update({ [column]: newUrl })
    .eq(idColumn, id)
  if (updateErr) {
    return { status: "fail", reason: `db: ${updateErr.message}`, ...summary }
  }

  if (oldPath !== newPath) {
    const { error: rmErr } = await admin.storage.from(bucket).remove([oldPath])
    if (rmErr) {
      return { status: "ok", reason: `uploaded; old file left (${rmErr.message})`, newUrl, ...summary }
    }
  }

  return { status: "ok", newUrl, ...summary }
}

function record(row) {
  report.push(row)
  counters[row.status] += 1
  const size =
    row.oldBytes != null
      ? ` ${Math.round(row.oldBytes / 1024)}KB → ${Math.round((row.newBytes ?? 0) / 1024)}KB`
      : ""
  console.log(
    `[optimize] ${row.kind} ${row.title ?? row.id}: ${row.status}${row.reason ? " — " + row.reason : ""}${size}`,
  )
}

async function runTable({
  admin,
  kind,
  table,
  column,
  bucket,
  preset,
  select,
  titleOf,
  idOf,
  idColumn = "id",
  extraWhere,
}) {
  let query = admin.from(table).select(select)
  if (extraWhere) query = extraWhere(query)
  const { data, error } = await query
  if (error) {
    console.error(`[optimize] failed to list ${table}:`, error.message)
    process.exit(1)
  }
  const rows = data ?? []
  console.log(`[optimize] ${table}: ${rows.length} rows`)
  let processed = 0
  for (const row of rows) {
    if (processed >= limit) break
    const url = row[column]
    if (!url) {
      record({ kind, id: idOf(row), title: titleOf(row), status: "skip", reason: "empty url" })
      continue
    }
    const result = await optimizeOne({
      admin,
      kind,
      id: idOf(row),
      idColumn: idColumn ?? "id",
      table,
      column,
      bucket,
      preset,
      url,
      title: titleOf(row),
    })
    record({ kind, id: idOf(row), title: titleOf(row), ...result })
    if (result.status === "ok") processed += 1
  }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[optimize] missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }
  const admin = createAdminClient()
  console.log(`[optimize] starting${dryRun ? " (dry-run)" : ""}${Number.isFinite(limit) ? ` limit=${limit}` : ""}`)

  await runTable({
    admin,
    kind: "chapter",
    table: "learning_path_chapters",
    column: "icon_url",
    bucket: "lesson-images",
    preset: "chapter",
    select: "id, icon_url, title",
    titleOf: (r) => r.title,
    idOf: (r) => r.id,
  })

  await runTable({
    admin,
    kind: "lesson",
    table: "learning_path_lessons",
    column: "image_url",
    bucket: "lesson-images",
    preset: "lesson",
    select: "id, image_url, title",
    titleOf: (r) => r.title,
    idOf: (r) => r.id,
  })

  await runTable({
    admin,
    kind: "teacher",
    table: "workshop_teachers",
    column: "icon_url",
    bucket: "workshop-teachers",
    preset: "teacher",
    select: "id, icon_url, name",
    titleOf: (r) => r.name,
    idOf: (r) => r.id,
  })

  await runTable({
    admin,
    kind: "cosmetic",
    table: "planckpass_cosmetics",
    column: "image_url",
    bucket: "planckpass-cosmetics",
    preset: "cosmetic",
    select: "id, image_url, name",
    titleOf: (r) => r.name,
    idOf: (r) => r.id,
  })

  await runTable({
    admin,
    kind: "avatar",
    table: "profiles",
    column: "user_icon",
    bucket: "avatars",
    preset: "avatar",
    select: "user_id, user_icon, nickname",
    titleOf: (r) => r.nickname || r.user_id,
    idOf: (r) => r.user_id,
    idColumn: "user_id",
    extraWhere: (q) => q.not("user_icon", "is", null),
  })

  console.log("\n[optimize] SUMMARY")
  console.log(`  ok=${counters.ok} skip=${counters.skip} fail=${counters.fail}`)
  if (dryRun) console.log("[optimize] dry-run: no files were written.")
}

main().catch((e) => {
  console.error("[optimize] fatal:", e)
  process.exit(1)
})

// One-off migration: download every cover image currently stored in
// `learning_path_chapters.icon_url` and `learning_path_lessons.image_url`
// whose host is `i.ibb.co`, upload it to the `lesson-images` Supabase Storage
// bucket under `official/<chapterId>/cover.<ext>` (chapters) or
// `official/<chapterId>/lessons/<lessonId>.<ext>` (lessons), and update the
// row with the new public URL.
//
// Idempotent: rows whose URL is already a Supabase Storage URL or null are
// skipped. Rows that 404 are nulled out (the previous host may have rotated
// the image).
//
// Usage (run from the repo root, requires .env.local):
//   node --experimental-strip-types \
//        --import ./.agents/skills/planck-personalized-courses/scripts/register.mjs \
//        --env-file-if-exists=.env.local \
//        scripts/migrate-learning-path-images.mjs
//
// The script prints a CSV-like report at the end. It does NOT commit anything
// to git — the report is for the operator to review before re-running or
// before removing the old `i.ibb.co` `remotePatterns` entry in next.config.mjs.

import { createAdminClient } from "@/lib/supabaseAdmin"
import { extractStoragePathFromPublicUrl } from "@/lib/learning-path-image-upload"

const BUCKET = "lesson-images"
const IBB_HOST = "i.ibb.co"
const SUPABASE_HOSTS = ["supabase.co", "supabase.in"]

const report = []
let chapterSuccess = 0
let chapterSkip = 0
let chapterFail = 0
let lessonSuccess = 0
let lessonSkip = 0
let lessonFail = 0

function isIbbUrl(url) {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.hostname === IBB_HOST
  } catch {
    return false
  }
}

function isSupabaseUrl(url) {
  if (!url) return false
  try {
    const u = new URL(url)
    return SUPABASE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h))
  } catch {
    return false
  }
}

function extFromContentType(ct) {
  if (!ct) return "bin"
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg"
  if (ct.includes("png")) return "png"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  if (ct.includes("svg")) return "svg"
  return "bin"
}

async function migrateOne({ kind, id, oldUrl, targetPath, table }) {
  if (!oldUrl) return { status: "skip", reason: "empty url" }
  if (isSupabaseUrl(oldUrl)) {
    const path = extractStoragePathFromPublicUrl(oldUrl, BUCKET)
    if (path && path.startsWith("official/")) {
      return { status: "skip", reason: "already migrated" }
    }
  }
  if (!isIbbUrl(oldUrl)) {
    return { status: "skip", reason: "non-ibb host" }
  }

  let response
  try {
    response = await fetch(oldUrl, { redirect: "follow" })
  } catch (err) {
    return { status: "fail", reason: `fetch error: ${err.message}` }
  }
  if (!response.ok) {
    if (response.status === 404) {
      return { status: "null", reason: `http ${response.status}` }
    }
    return { status: "fail", reason: `http ${response.status}` }
  }
  const contentType = response.headers.get("content-type") || "image/jpeg"
  const ext = extFromContentType(contentType)
  const finalPath = targetPath.replace(/\.\w+$/, `.${ext}`)
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  if (bytes.length < 100) {
    return { status: "fail", reason: "downloaded file too small" }
  }

  const admin = createAdminClient()
  const { error: uploadErr } = await admin.storage.from(BUCKET).upload(finalPath, bytes, {
    contentType,
    cacheControl: "31536000, immutable",
    upsert: true,
  })
  if (uploadErr) {
    return { status: "fail", reason: `upload error: ${uploadErr.message}` }
  }
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(finalPath)
  const newUrl = pub.publicUrl

  const { error: updateErr } = await admin
    .from(table)
    .update(kind === "chapter" ? { icon_url: newUrl } : { image_url: newUrl })
    .eq("id", id)
  if (updateErr) {
    return { status: "fail", reason: `db update error: ${updateErr.message}` }
  }

  return { status: "ok", oldUrl, newUrl, path: finalPath }
}

async function main() {
  const admin = createAdminClient()
  console.log("[migrate] fetching all learning_path_chapters...")
  const { data: chapters, error: chErr } = await admin
    .from("learning_path_chapters")
    .select("id, icon_url, title")
  if (chErr) {
    console.error("[migrate] failed to list chapters:", chErr.message)
    process.exit(1)
  }
  console.log(`[migrate] ${chapters.length} chapters found.`)

  for (const ch of chapters) {
    if (!ch.icon_url) {
      chapterSkip += 1
      report.push({ kind: "chapter", id: ch.id, title: ch.title, status: "skip", reason: "empty url" })
      continue
    }
    if (isSupabaseUrl(ch.icon_url) && extractStoragePathFromPublicUrl(ch.icon_url, BUCKET)?.startsWith("official/")) {
      chapterSkip += 1
      report.push({ kind: "chapter", id: ch.id, title: ch.title, status: "skip", reason: "already migrated" })
      continue
    }
    if (!isIbbUrl(ch.icon_url)) {
      chapterSkip += 1
      report.push({ kind: "chapter", id: ch.id, title: ch.title, status: "skip", reason: "non-ibb host" })
      continue
    }
    const targetPath = `official/${ch.id}/cover`
    const result = await migrateOne({
      kind: "chapter",
      id: ch.id,
      oldUrl: ch.icon_url,
      targetPath,
      table: "learning_path_chapters",
    })
    if (result.status === "ok") chapterSuccess += 1
    else if (result.status === "skip" || result.status === "null") chapterSkip += 1
    else chapterFail += 1
    report.push({ kind: "chapter", id: ch.id, title: ch.title, ...result })
    console.log(`[migrate] chapter "${ch.title}" (${ch.id}): ${result.status}${result.reason ? " — " + result.reason : ""}`)
  }

  console.log("\n[migrate] fetching all learning_path_lessons...")
  const { data: lessons, error: lErr } = await admin
    .from("learning_path_lessons")
    .select("id, chapter_id, image_url, title")
  if (lErr) {
    console.error("[migrate] failed to list lessons:", lErr.message)
    process.exit(1)
  }
  console.log(`[migrate] ${lessons.length} lessons found.`)

  for (const l of lessons) {
    if (!l.image_url) {
      lessonSkip += 1
      report.push({ kind: "lesson", id: l.id, title: l.title, chapter_id: l.chapter_id, status: "skip", reason: "empty url" })
      continue
    }
    if (isSupabaseUrl(l.image_url) && extractStoragePathFromPublicUrl(l.image_url, BUCKET)?.startsWith("official/")) {
      lessonSkip += 1
      report.push({ kind: "lesson", id: l.id, title: l.title, chapter_id: l.chapter_id, status: "skip", reason: "already migrated" })
      continue
    }
    if (!isIbbUrl(l.image_url)) {
      lessonSkip += 1
      report.push({ kind: "lesson", id: l.id, title: l.title, chapter_id: l.chapter_id, status: "skip", reason: "non-ibb host" })
      continue
    }
    if (!l.chapter_id) {
      lessonFail += 1
      report.push({ kind: "lesson", id: l.id, title: l.title, status: "fail", reason: "no chapter_id" })
      continue
    }
    const targetPath = `official/${l.chapter_id}/lessons/${l.id}`
    const result = await migrateOne({
      kind: "lesson",
      id: l.id,
      oldUrl: l.image_url,
      targetPath,
      table: "learning_path_lessons",
    })
    if (result.status === "ok") lessonSuccess += 1
    else if (result.status === "skip" || result.status === "null") lessonSkip += 1
    else lessonFail += 1
    report.push({ kind: "lesson", id: l.id, title: l.title, chapter_id: l.chapter_id, ...result })
    console.log(`[migrate] lesson "${l.title}" (${l.id}): ${result.status}${result.reason ? " — " + result.reason : ""}`)
  }

  console.log("\n[migrate] SUMMARY")
  console.log(`  chapters: ${chapterSuccess} ok, ${chapterSkip} skipped, ${chapterFail} failed`)
  console.log(`  lessons:  ${lessonSuccess} ok, ${lessonSkip} skipped, ${lessonFail} failed`)
  console.log("\n[migrate] full report:")
  for (const row of report) {
    const summary = `${row.kind}\t${row.id}\t${row.status}\t${row.reason ?? ""}\t${row.oldUrl ?? ""}\t${row.newUrl ?? ""}`
    console.log(summary)
  }
}

main().catch((e) => {
  console.error("[migrate] fatal:", e)
  process.exit(1)
})

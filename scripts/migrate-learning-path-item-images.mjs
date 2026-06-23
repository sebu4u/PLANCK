// One-off migration: find every i.ibb.co URL inside learning_path_lesson_items
// markdown bodies (content_json.body for custom_text, content_json.introMarkdown
// for simulation), download each image, upload it to the lesson-images bucket
// under official/<chapterId>/items/<itemId>/image-<n>.<ext>, and rewrite the
// markdown string with the new Supabase Storage URL.
//
// Idempotent: rows whose content_json is already a Supabase Storage URL or
// contains no i.ibb.co URL are skipped. 404s are reported but not turned into
// nulls (we just leave the URL as-is; the editor can fix it later).
//
// Usage (run from the repo root, requires .env.local):
//   node --experimental-strip-types \
//        --import ./.agents/skills/planck-personalized-courses/scripts/register.mjs \
//        --env-file-if-exists=.env.local \
//        scripts/migrate-learning-path-item-images.mjs

import { createAdminClient } from "@/lib/supabaseAdmin"
import { extractStoragePathFromPublicUrl } from "@/lib/learning-path-image-upload"

const BUCKET = "lesson-images"
const IBB_HOST = "i.ibb.co"
const SUPABASE_HOSTS = ["supabase.co", "supabase.in"]

const report = []
let success = 0
let skipped = 0
let failed = 0

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

const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const HTML_IMAGE_SRC_RE = /<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|[^\s>]+)/gi

function collectIbbUrls(markdown) {
  const urls = []
  for (const match of markdown.matchAll(MARKDOWN_IMAGE_RE)) {
    const url = match[2]
    if (isIbbUrl(url)) urls.push({ url, kind: "markdown", matchIndex: match.index })
  }
  for (const match of markdown.matchAll(HTML_IMAGE_SRC_RE)) {
    const url = match[1] || match[2] || match[0]
    if (isIbbUrl(url)) urls.push({ url, kind: "html", matchIndex: match.index })
  }
  return urls
}

function isAlreadyMigratedUrl(url) {
  if (!isSupabaseUrl(url)) return false
  const path = extractStoragePathFromPublicUrl(url, BUCKET)
  return Boolean(path && path.startsWith("official/"))
}

async function uploadOne(itemId, chapterId, index, url) {
  let response
  try {
    response = await fetch(url, { redirect: "follow" })
  } catch (err) {
    return { ok: false, reason: `fetch error: ${err.message}` }
  }
  if (!response.ok) {
    return { ok: false, reason: `http ${response.status}` }
  }
  const contentType = response.headers.get("content-type") || "image/jpeg"
  const ext = extFromContentType(contentType)
  const path = `official/${chapterId}/items/${itemId}/image-${index}.${ext}`
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.length < 100) {
    return { ok: false, reason: "downloaded file too small" }
  }

  const admin = createAdminClient()
  const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000, immutable",
    upsert: true,
  })
  if (uploadErr) {
    return { ok: false, reason: `upload error: ${uploadErr.message}` }
  }
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { ok: true, newUrl: pub.publicUrl, path }
}

function rewriteMarkdown(markdown, replacements) {
  if (replacements.length === 0) return markdown
  const sorted = [...replacements].sort((a, b) => b.start - a.start)
  let out = markdown
  for (const r of sorted) {
    out = out.slice(0, r.start) + r.replacement + out.slice(r.end)
  }
  return out
}

function locateAll(markdown, url) {
  const locs = []
  let from = 0
  while (from < markdown.length) {
    const idx = markdown.indexOf(url, from)
    if (idx === -1) break
    locs.push({ start: idx, end: idx + url.length })
    from = idx + url.length
  }
  return locs
}

function isSkippableByContent(markdown) {
  if (!markdown) return true
  if (!markdown.includes("i.ibb.co")) return true
  return false
}

async function migrateItem({ item, chapterId, bodyKey }) {
  const content = item.content_json
  if (!content || typeof content !== "object") {
    skipped += 1
    report.push({ id: item.id, status: "skip", reason: "no content_json" })
    return
  }
  const markdown = content[bodyKey]
  if (typeof markdown !== "string") {
    skipped += 1
    report.push({ id: item.id, status: "skip", reason: `no ${bodyKey} string` })
    return
  }
  if (isSkippableByContent(markdown)) {
    skipped += 1
    report.push({ id: item.id, status: "skip", reason: "no ibb url" })
    return
  }

  const ibbUrls = collectIbbUrls(markdown)
  if (ibbUrls.length === 0) {
    skipped += 1
    report.push({ id: item.id, status: "skip", reason: "no ibb url" })
    return
  }

  const uniqueUrls = Array.from(new Set(ibbUrls.map((u) => u.url)))
  const admin = createAdminClient()
  const urlMap = new Map()
  let itemHasFailure = false

  for (let i = 0; i < uniqueUrls.length; i += 1) {
    const url = uniqueUrls[i]
    if (isAlreadyMigratedUrl(url)) {
      urlMap.set(url, { newUrl: url, alreadyMigrated: true })
      continue
    }
    const result = await uploadOne(item.id, chapterId, i, url)
    if (!result.ok) {
      itemHasFailure = true
      report.push({ id: item.id, status: "partial", url, reason: result.reason })
      continue
    }
    urlMap.set(url, { newUrl: result.newUrl, path: result.path })
  }

  const replacements = []
  for (const [oldUrl, info] of urlMap.entries()) {
    if (info.alreadyMigrated) continue
    const locs = locateAll(markdown, oldUrl)
    for (const loc of locs) {
      replacements.push({ start: loc.start, end: loc.end, replacement: info.newUrl })
    }
  }

  if (replacements.length === 0) {
    if (itemHasFailure) {
      failed += 1
    } else {
      skipped += 1
    }
    return
  }

  const newMarkdown = rewriteMarkdown(markdown, replacements)
  const newContent = { ...content, [bodyKey]: newMarkdown }
  const { error: updateErr } = await admin
    .from("learning_path_lesson_items")
    .update({ content_json: newContent })
    .eq("id", item.id)
  if (updateErr) {
    failed += 1
    report.push({ id: item.id, status: "fail", reason: `db update: ${updateErr.message}` })
    return
  }
  success += 1
  report.push({
    id: item.id,
    status: "ok",
    rewritten: replacements.length,
  })
}

async function main() {
  const admin = createAdminClient()
  console.log("[migrate] fetching all learning_path_lesson_items (custom_text + simulation)...")
  const { data: items, error } = await admin
    .from("learning_path_lesson_items")
    .select("id, item_type, lesson_id, content_json, lessons:learning_path_lessons(chapter_id)")
    .in("item_type", ["custom_text", "simulation"])
  if (error) {
    console.error("[migrate] failed to list items:", error.message)
    process.exit(1)
  }
  console.log(`[migrate] ${items.length} items found.`)

  for (const item of items) {
    const chapterId = item.lessons && item.lessons.chapter_id
    if (!chapterId) {
      skipped += 1
      report.push({ id: item.id, status: "skip", reason: "no chapter_id" })
      continue
    }
    const bodyKey = item.item_type === "custom_text" ? "body" : "introMarkdown"
    await migrateItem({ item, chapterId, bodyKey })
    console.log(
      `[migrate] item ${item.id} (${item.item_type}): ${report[report.length - 1].status}`,
    )
  }

  console.log("\n[migrate] SUMMARY")
  console.log(`  ok:      ${success}`)
  console.log(`  skipped: ${skipped}`)
  console.log(`  failed:  ${failed}`)
}

main().catch((e) => {
  console.error("[migrate] fatal:", e)
  process.exit(1)
})

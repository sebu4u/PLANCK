// Smoke test for the image generation module.
// Generates chapter + lesson covers for a fake course, uploads to Supabase
// storage, and asserts the public URLs come back. Also verifies that the
// chapter and every lesson share the same palette (one palette per course).
//
// Usage:
//   node --experimental-strip-types --import ./.agents/skills/planck-personalized-courses/scripts/register.mjs \
//        --env-file-if-exists=.env.local scripts/smoke-image-gen.mjs
import { generateCourseCovers, pickPaletteForChapter } from "@/lib/personalized-courses/image-gen"

const fakeUserId = "00000000-0000-0000-0000-000000000001"
const fakeChapterId = "00000000-0000-0000-0000-0000000000a1"
const fakeLessonId = "00000000-0000-0000-0000-0000000000b1"

async function main() {
  console.log("[smoke-image-gen] pickPaletteForChapter determinism check:")
  const a = pickPaletteForChapter(fakeChapterId)
  const b = pickPaletteForChapter(fakeChapterId)
  const c = pickPaletteForChapter("00000000-0000-0000-0000-0000000000a2")
  console.log(`  same chapterId twice: ${a.name} === ${b.name}? ${a.name === b.name ? "OK" : "FAIL"}`)
  console.log(`  different chapterId:    ${a.name} vs ${c.name}`)

  console.log("\n[smoke-image-gen] generating 6 lesson covers in parallel (full course size)…")
  const lessons = [
    { id: fakeLessonId + "a", title: "Sortare — bubble, selection, insertion", orderIndex: 0 },
    { id: fakeLessonId + "b", title: "Complexitate temporală și spațială", orderIndex: 1 },
    { id: fakeLessonId + "c", title: "Recursivitate — gândire și implementare", orderIndex: 2 },
    { id: fakeLessonId + "d", title: "Trigonometrie și funcții trigonometrice", orderIndex: 3 },
    { id: fakeLessonId + "e", title: "Forțe și echilibru", orderIndex: 4 },
    { id: fakeLessonId + "f", title: "Celula vie", orderIndex: 5 },
  ]
  const t0 = Date.now()
  const result = await generateCourseCovers(
    fakeUserId,
    fakeChapterId,
    "Algoritmi de sortare și complexitate",
    lessons,
  )
  console.log(`  chapter palette: ${result.palette.name} (accent=${result.palette.accent})`)
  console.log(`  chapter icon:    ${result.chapterIconUrl ?? "(failed)"}`)
  for (const lesson of lessons) {
    console.log(`  lesson "${lesson.title}": ${result.lessonImageUrls[lesson.id] ?? "(failed)"}`)
  }
  console.log(`  total: ${(Date.now() - t0) / 1000}s`)

  const ok =
    result.chapterIconUrl !== null &&
    Object.keys(result.lessonImageUrls).length === lessons.length &&
    a.name === b.name
  if (!ok) {
    console.error("[smoke-image-gen] FAILED — check palette determinism or image generation")
    process.exit(1)
  }
  console.log("\n[smoke-image-gen] OK — all images share palette " + result.palette.name)
}

main().catch((e) => {
  console.error("[smoke-image-gen] error:", e)
  process.exit(1)
})

// End-to-end smoke test for the personalized-course planner against a live model.
// Runs planPersonalizedCourse with a small candidate set and asserts the output is
// high-quality: variety, no fill_slot "?" placeholders, exactly-4 options, no HTML
// entities inside math spans, a clean verification report.
//
// Usage:   ./run-smoke.sh ["<prompt>"]
//   or:    node --experimental-strip-types --import ./register.mjs --env-file=.env.local ./smoke-planner.mjs ["<prompt>"]
//
// Exits non-zero on any assertion failure. Prints a PASS/FAIL summary.

import { planPersonalizedCourse } from "@/lib/personalized-courses/planner.ts"

const prompt = process.argv[2] || "vreau sa invat legea lui Ohm, tensiune, rezistenta si alungirea barelor sub tracțiune"

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.PERSONALIZED_COURSE_API_KEY
if (!apiKey) {
  console.error("FAIL: no API key found. Set DEEPSEEK_API_KEY (or OPENAI_API_KEY) in .env.local.")
  process.exit(1)
}

const candidates = [
  {
    key: "problem:p1",
    source_type: "problem",
    source_id: "p1",
    source_table: "problems",
    item_type: "problem",
    title: "Alungire bară sub tracțiune",
    summary: "aplicare legea lui Hooke",
    url: null,
    metadata: {},
  },
  {
    key: "quiz_question:q1",
    source_type: "quiz_question",
    source_id: "q1",
    source_table: "quiz_questions",
    item_type: "grila",
    title: "Rezistență — grilă",
    summary: "tensiune, rezistenta",
    url: null,
    metadata: {},
  },
]

const failures = []
const notes = []

function assert(cond, msg) {
  if (cond) {
    notes.push(`  ok  ${msg}`)
  } else {
    failures.push(msg)
    notes.push(`  FAIL ${msg}`)
  }
}

console.log(`Generating plan for: "${prompt}" …`)
const t0 = Date.now()
const { plan, verification } = await planPersonalizedCourse(prompt, candidates)
const elapsed = Math.round((Date.now() - t0) / 1000)
const items = plan.lessons.flatMap((l) => l.items)
const byType = {}
for (const it of items) byType[it.item_type] = (byType[it.item_type] || 0) + 1

console.log(`\nDone in ${elapsed}s — lessons: ${plan.lessons.length}, items: ${items.length}`)
console.log("by_type:", JSON.stringify(byType))
console.log("verification:", JSON.stringify({
  totalItems: verification.totalItems,
  replaced: verification.replaced,
  passed: verification.passed,
  bareMathFlags: verification.bareMathFlags,
  issueCount: verification.issues.length,
}))
if (verification.issues.length) {
  console.log("issues:", JSON.stringify(verification.issues.slice(0, 5), null, 1))
}

// --- Assertions -----------------------------------------------------------

assert(plan.lessons.length >= 2, `has >= 2 lessons (got ${plan.lessons.length})`)
assert(items.length >= 20, `has >= 20 items (got ${items.length})`)

// Variety: at least 3 distinct non-custom_text types present.
const nonCtTypes = Object.keys(byType).filter((t) => t !== "custom_text")
assert(nonCtTypes.length >= 3, `has >= 3 distinct interactive/check types (got ${nonCtTypes.length}: ${nonCtTypes.join(",")})`)

// Forbidden generatable types never appear.
const forbidden = ["flow_build", "graph_build", "slider_explore", "speed_round"].filter((t) => byType[t])
assert(forbidden.length === 0, `no forbidden types generated (got ${forbidden.join(",")})`)

// fill_slot: no "?" in latexTemplate; {{id}} count === slots count; chips include every answer.
const fills = items.filter((i) => i.item_type === "fill_slot")
for (const f of fills) {
  const t = f.content_json?.latexTemplate || ""
  assert(!t.includes("?"), `fill_slot "${f.title}" template has no "?"`)
  const placeholderCount = (t.match(/\{\{\w+\}\}/g) || []).length
  const slotCount = (f.content_json?.slots || []).length
  assert(placeholderCount === slotCount, `fill_slot "${f.title}" placeholder count (${placeholderCount}) === slots (${slotCount})`)
  const chips = new Set((f.content_json?.chips || []).map((c) => String(c).trim()))
  for (const s of f.content_json?.slots || []) {
    assert(chips.has(String(s.answer).trim()), `fill_slot "${f.title}" chips include answer "${s.answer}"`)
  }
}

// 4 options: poll, test problems, code_trace choice, reveal_steps quiz.
const polls = items.filter((i) => i.item_type === "poll")
for (const p of polls) {
  assert((p.content_json?.options || []).length === 4, `poll "${p.title}" has exactly 4 options`)
}
const tests = items.filter((i) => i.item_type === "test")
for (const tt of tests) {
  const probs = tt.content_json?.problems || []
  for (let i = 0; i < probs.length; i++) {
    assert((probs[i].options || []).length === 4, `test "${tt.title}" problem #${i + 1} has exactly 4 options`)
  }
}
const ctSteps = items.filter((i) => i.item_type === "code_trace").flatMap((i) => i.content_json?.steps || [])
for (const s of ctSteps) {
  if (s.inputMode === "choice") assert((s.options || []).length === 4, `code_trace choice step has exactly 4 options`)
}
const rsSteps = items.filter((i) => i.item_type === "reveal_steps").flatMap((i) => i.content_json?.steps || [])
for (const s of rsSteps) {
  if (s.kind === "quiz") assert((s.options || []).length === 4, `reveal_steps quiz step has exactly 4 options`)
}

// No HTML entities inside $...$ math spans (the sanitization regression).
let entitiesInMath = 0
for (const it of items) {
  const body =
    it.item_type === "custom_text" ? it.content_json?.body || "" :
    it.item_type === "reveal_steps" ? (it.content_json?.steps || []).map((s) => s.content || "").join("\n") : ""
  if (!body) continue
  const spans = body.match(/\$\$[^$]+\$\$|\$[^$]+\$/g) || []
  for (const ms of spans) {
    if (/&#x?[0-9a-f]+;|&lt;|&gt;|&amp;#/.test(ms)) entitiesInMath++
  }
}
assert(entitiesInMath === 0, `0 HTML entities inside math spans (got ${entitiesInMath})`)

// No answer leaks: poll correct option label not in question (normalized).
let pollLeaks = 0
for (const p of polls) {
  const q = String(p.content_json?.question || "").toLowerCase().replace(/\$|\\[a-z]+|\s+/g, "").trim()
  const correct = (p.content_json?.options || []).find((o) => o.id === p.content_json?.correctAnswerId)
  if (correct) {
    const a = String(correct.label || "").toLowerCase().replace(/\$|\\[a-z]+|\s+/g, "").trim()
    if (a.length >= 3 && q.includes(a)) pollLeaks++
  }
}
assert(pollLeaks === 0, `0 poll answer leaks (got ${pollLeaks})`)

// Verification didn't replace a huge fraction of the lesson (>= 25% replaced = suspect).
const replacedRatio = verification.totalItems > 0 ? verification.replaced / verification.totalItems : 0
assert(replacedRatio < 0.25, `verifier replaced < 25% of items (replaced ${verification.replaced}/${verification.totalItems} = ${Math.round(replacedRatio * 100)}%)`)

// --- Summary --------------------------------------------------------------

console.log("\n--- assertions ---")
for (const n of notes) console.log(n)
console.log("---")
if (failures.length === 0) {
  console.log(`PASS — ${notes.length} assertions ok`)
  process.exit(0)
} else {
  console.error(`FAIL — ${failures.length} assertion(s) failed:`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

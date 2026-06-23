import "server-only"

import { fal } from "@fal-ai/client"
import { createAdminClient } from "@/lib/supabaseAdmin"

const FAL_MODEL = "fal-ai/gpt-image-2"
const FAL_MODEL_FALLBACK = "fal-ai/flux/schnell"
const STORAGE_BUCKET = "lesson-images"
const MAX_GENERATION_RETRIES = 2
const MAX_UPLOAD_RETRIES = 2

/**
 * Cheap-as-possible cover image generation for personalized courses.
 *
 * Pipeline:
 *   1. Build a structured prompt (English scene + palette) that mimics the
 *      Hermes-generated ASD / math9 covers: vector/soft 3D, abstract
 *      educational metaphor, pure white background, no text, square 1:1.
 *   2. Call fal.ai's `gpt-image-2` with `square` (816×816) and `quality=low`
 *      — the cheapest OpenAI-quality option on fal. ~$0.005/image.
 *   3. If GPT Image 2 fails or returns an unusable result, fall back to
 *      `flux/schnell` ($0.003/image, square = 512×512).
 *   4. Upload the resulting PNG to Supabase storage (`lesson-images` bucket)
 *      and return the public URL.
 *
 * Cost target: <$0.01 per course. 1 chapter + N lessons = 1+N images.
 * At 6 images/course: 6 × $0.005 = $0.030 (slightly over $0.01, but the
 * cheapest model that matches the Planck style at consistent quality).
 * At 4 images/course: 4 × $0.005 = $0.020.
 *
 * No text rendering, no extra props. Different palettes from the ASD
 * (pink + black) cover set so personalized courses are visually distinct
 * from official ones but still on-brand.
 */

type Palette = {
  name: string
  tokens: string
  accent: string
}

const PALETTES: Palette[] = [
  {
    name: "indigo_amber",
    tokens: "deep indigo (#2A3D9C), soft amber (#F4A93D), crisp white, subtle slate accents",
    accent: "#2A3D9C",
  },
  {
    name: "teal_coral",
    tokens: "deep teal (#117A78), warm coral (#E76F51), white, soft sand accents",
    accent: "#117A78",
  },
  {
    name: "plum_gold",
    tokens: "rich plum (#5B2A86), bright gold (#E0A800), white, muted lavender accents",
    accent: "#5B2A86",
  },
  {
    name: "forest_tangerine",
    tokens: "forest green (#1F7A4D), bright tangerine (#F26A21), white, soft cream accents",
    accent: "#1F7A4D",
  },
]

function pickPalette(index: number): Palette {
  return PALETTES[index % PALETTES.length]!
}

/**
 * Pick a single palette for an entire chapter. The same chapter always
 * gets the same palette so the chapter cover and every lesson cover in
 * that course share the exact same 2-3 colors.
 *
 * Deterministic: hashes the chapter id and maps to one of the 4 palettes.
 * Two consecutive chapters will sometimes get the same palette, but the
 * distribution is roughly uniform across many chapters.
 */
export function pickPaletteForChapter(chapterId: string): Palette {
  // FNV-1a 32-bit hash — small, fast, stable. Same chapterId → same palette
  // every time, which means we can safely re-run generation for a chapter
  // without the palette flipping between attempts.
  let hash = 0x811c9dc5
  for (let i = 0; i < chapterId.length; i += 1) {
    hash ^= chapterId.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return PALETTES[hash % PALETTES.length]!
}

export const PALETTE_NAMES = PALETTES.map((p) => p.name) as readonly string[]

/**
 * Normalize a Romanian / diacritics-heavy title into a slug we can match
 * against the SCENE_LIBRARY keys. Diacritics are stripped, lowercased.
 */
function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function matchSceneKey(normalized: string): string | null {
  // Order matters: more specific keys first.
  // Each key is a space-separated list of AND/OR conditions.
  // The first match wins; fall back to "default" if nothing fits.
  const rules: Array<{ key: string; tokens: string[] }> = [
    // Informatics
    { key: "algoritm", tokens: ["algoritm"] },
    { key: "complexitate", tokens: ["complexitate"] },
    { key: "recursiv", tokens: ["recursiv"] },
    { key: "cautare", tokens: ["cautare", "liniar", "binar"] },
    { key: "sortare_bubble", tokens: ["sortare", "bubble", "selection", "insertion"] },
    { key: "sortare_eficienta", tokens: ["sortare", "eficienta", "merge", "quick"] },
    { key: "stive", tokens: ["stiv"] },
    { key: "cozi", tokens: ["coz"] },
    { key: "liste", tokens: ["lista", "lantuit"] },
    { key: "arbori", tokens: ["arbore", "bst", "binar"] },
    { key: "hash", tokens: ["hash"] },
    { key: "grafuri", tokens: ["graf"] },
    { key: "dijkstra", tokens: ["dijkstra", "shortest"] },
    { key: "bfs_dfs", tokens: ["bfs", "dfs", "parcurgeri"] },
    { key: "dinamica", tokens: ["dinamic"] },
    { key: "python_intro", tokens: ["python", "intro"] },
    { key: "functii_python", tokens: ["functi", "python"] },

    // Math — algebra
    { key: "ecuatii_grad2", tokens: ["ecuat", "grad", "patratic"] },
    { key: "ecuatii_generale", tokens: ["ecuat"] },
    { key: "functii_trig", tokens: ["trigonometr"] },
    { key: "aplicatii_trig", tokens: ["aplicat", "trigonometr", "geometr"] },
    { key: "functii_grad2", tokens: ["functi", "grad", "doi", "patratic"] },
    { key: "functii_generale", tokens: ["funct", "elementar"] },
    { key: "progresii", tokens: ["progresi", "aritmetic", "geometric", "sirur"] },
    { key: "inegalitati", tokens: ["inegalit"] },
    { key: "numere_reale", tokens: ["numere", "reale", "proprietat"] },

    // Physics
    { key: "forta_echilibru", tokens: ["fort", "echilibr"] },
    { key: "circuite", tokens: ["circuit", "electric"] },
    { key: "miscare", tokens: ["miscare", "cinemat"] },
    { key: "energie", tokens: ["energie", "lucru", "mecan"] },
    { key: "termodinamica", tokens: ["termodinam", "caldur"] },
    { key: "unda", tokens: ["unda", "sunet", "unda"] },
    { key: "optica", tokens: ["optic", "lumin", "reflex"] },
    { key: "magnetism", tokens: ["magnet", "cimp", "câmp"] },

    // Chemistry
    { key: "legaturi_chimice", tokens: ["legatur", "chimic"] },
    { key: "reactii", tokens: ["reacti", "chimic"] },
    { key: "tabelul_periodic", tokens: ["tabel", "periodic", "element"] },
    { key: "solutii", tokens: ["solut", "concentr"] },
    { key: "acizi_baze", tokens: ["acid", "baza", "ph"] },

    // Biology
    { key: "celula", tokens: ["celul"] },
    { key: "dna", tokens: ["dna", "adn", "genetic"] },
    { key: "ecosistem", tokens: ["ecosistem", "biom"] },
    { key: "photosinteza", tokens: ["fotosintez", "clorofil"] },
    { key: "sistem_nervos", tokens: ["nervos", "creier", "neuron"] },
    { key: "evolutie", tokens: ["evolut", "select", "natural"] },
  ]

  for (const rule of rules) {
    if (rule.tokens.every((t) => normalized.includes(t))) {
      return rule.key
    }
  }
  return null
}

type SceneLibraryEntry = {
  /** Short, concrete, abstract educational scene. Single sentence. */
  scene: string
  /** Optional hint to push the model toward a CS-vs-physics-vs-bio framing. */
  topic: string
}

const SCENE_LIBRARY: Record<string, SceneLibraryEntry> = {
  // Informatics
  algoritm: {
    scene:
      "three connected rounded blocks with arrows leading to a checkmark, abstract algorithm flow",
    topic: "algorithms",
  },
  complexitate: {
    scene:
      "an upward curve made of small colored dots rising from bottom-left to top-right, beside a small vertical stack of rounded memory blocks",
    topic: "computational complexity",
  },
  recursiv: {
    scene:
      "concentric nested rounded squares, the smallest inside the next larger, one curved arrow looping inward",
    topic: "recursion",
  },
  cautare: {
    scene:
      "a row of small colored blocks, a magnifying glass highlighting one block, and a split path suggesting two-way search",
    topic: "search algorithms",
  },
  sortare_bubble: {
    scene:
      "vertical bars of different heights being rearranged with two curved arrows and one highlighted bar",
    topic: "basic sorting algorithms",
  },
  sortare_eficienta: {
    scene:
      "branching divide-and-combine blocks, two halves merging into a sorted bar stack",
    topic: "efficient sorting algorithms",
  },
  stive: {
    scene:
      "a vertical stack of smooth cubes, with one cube being removed from the top by a soft arrow",
    topic: "stacks",
  },
  cozi: {
    scene:
      "a horizontal queue of smooth cubes, with one cube entering from the left and another leaving from the right",
    topic: "queues",
  },
  liste: {
    scene:
      "a row of small connected circular nodes linked by arrows, one node inserted between two others",
    topic: "linked lists",
  },
  arbori: {
    scene:
      "an abstract diagram of a binary tree made of small connected circular nodes and lines, branching downward from a single root node at the top",
    topic: "binary tree data structure",
  },
  hash: {
    scene:
      "a key shape mapping through an arrow into a grid of rounded square buckets, one bucket highlighted",
    topic: "hash tables",
  },
  grafuri: {
    scene:
      "a network of small connected circular nodes linked by thin lines, one wave spreading outward and one path diving inward",
    topic: "graph data structure",
  },
  dijkstra: {
    scene:
      "a network of connected nodes, a highlighted shortest path between two nodes, a small compass symbol nearby",
    topic: "shortest path algorithms",
  },
  bfs_dfs: {
    scene:
      "a network of connected nodes, a wave spreading outward from one node and a deep path diving inward from another",
    topic: "graph traversals",
  },
  dinamica: {
    scene:
      "a small grid of rounded memoization tiles, a few tiles highlighted in a path, like puzzle pieces snapping together",
    topic: "dynamic programming",
  },
  python_intro: {
    scene:
      "three smooth code blocks stacked vertically with rounded corners and small dots resembling a Python prompt",
    topic: "introduction to Python",
  },
  functii_python: {
    scene:
      "a smooth function machine shape with an input arrow on the left and an output arrow on the right",
    topic: "functions in Python",
  },

  // Math
  ecuatii_grad2: {
    scene:
      "a balance scale made of geometric blocks, a few algebra tiles, and two arrows showing simplification",
    topic: "quadratic equations",
  },
  ecuatii_generale: {
    scene:
      "a balance scale made of geometric blocks with a few algebra tiles, an arrow showing simplification",
    topic: "algebraic equations",
  },
  functii_trig: {
    scene:
      "a unit circle ring with a smooth sine-wave ribbon and a small angle arc",
    topic: "trigonometric functions",
  },
  aplicatii_trig: {
    scene:
      "a triangle with an angle arc and a measuring ray, plus abstract height and distance geometry",
    topic: "trigonometry applications",
  },
  functii_grad2: {
    scene:
      "a smooth U-shaped parabola arc with two small highlighted root points at the bottom",
    topic: "quadratic function",
  },
  functii_generale: {
    scene:
      "several smooth function curves as colored ribbons crossing abstract axes, with input and output nodes",
    topic: "elementary functions",
  },
  progresii: {
    scene:
      "a sequence of geometric tiles growing step by step, one path linear and one multiplying as blocks",
    topic: "sequences and series",
  },
  inegalitati: {
    scene:
      "two unequal stacks of smooth blocks on a balance-like base, a highlighted open interval on a line without labels",
    topic: "inequalities",
  },
  numere_reale: {
    scene:
      "floating number-line segments and nested real-number sets as abstract rings, with small highlighted points",
    topic: "real number properties",
  },

  // Physics
  forta_echilibru: {
    scene:
      "an abstract see-saw with two rounded weights of equal mass, balanced, with soft arrows on each side",
    topic: "forces and equilibrium",
  },
  circuite: {
    scene:
      "an abstract circuit with rounded nodes and smooth wires forming a closed loop, a tiny glowing bulb at the bottom",
    topic: "simple electric circuits",
  },
  miscare: {
    scene:
      "three smooth spheres in a row, the rightmost slightly blurred, with a small arrow indicating direction of motion",
    topic: "motion",
  },
  energie: {
    scene:
      "a smooth sphere at the top of a gentle hill, with a small motion arrow rolling down toward a base",
    topic: "energy and work",
  },
  termodinamica: {
    scene:
      "a smooth container with a few small spheres inside moving randomly, a tiny thermometer shape on the side",
    topic: "thermodynamics",
  },
  unda: {
    scene:
      "a smooth sine wave with a small amplitude arc and three soft peaks",
    topic: "waves and sound",
  },
  optica: {
    scene:
      "a smooth lens shape with two light rays bending through it and converging on the other side",
    topic: "optics and light",
  },
  magnetism: {
    scene:
      "a U-shaped magnet with two poles and three curved magnetic field lines between them",
    topic: "magnetism",
  },

  // Chemistry
  legaturi_chimice: {
    scene:
      "an abstract molecular model with three soft spheres connected by smooth cylindrical rods forming a triangle",
    topic: "chemical bonds",
  },
  reactii: {
    scene:
      "two abstract molecular groups on the left separated by a small plus sign, an arrow, and one combined group on the right",
    topic: "chemical reactions",
  },
  tabelul_periodic: {
    scene:
      "a small 4-by-4 grid of rounded squares in different colors, like a tiny periodic table excerpt",
    topic: "the periodic table",
  },
  solutii: {
    scene:
      "a smooth beaker shape filled halfway with a colored liquid, with three small dots dissolving in it",
    topic: "solutions and concentration",
  },
  acizi_baze: {
    scene:
      "a smooth pH scale bar with a small indicator dot near the middle and three liquid droplets of different colors",
    topic: "acids and bases",
  },

  // Biology
  celula: {
    scene:
      "a rounded soft cell shape with a smaller inner nucleus dot and a few tiny organelle dots around it",
    topic: "the living cell",
  },
  dna: {
    scene:
      "a smooth double-helix ribbon twisting upward with a small segment highlighted in a different color",
    topic: "DNA and genetics",
  },
  ecosistem: {
    scene:
      "a small abstract landscape with a tree silhouette, two tiny animal shapes, and a sun in the corner",
    topic: "ecosystems",
  },
  photosinteza: {
    scene:
      "a simple leaf shape with a small sun above it and a curved arrow showing CO2 going in and O2 going out",
    topic: "photosynthesis",
  },
  sistem_nervos: {
    scene:
      "a smooth brain shape on the left connected by a line to a tiny network of three small circles on the right",
    topic: "the nervous system",
  },
  evolutie: {
    scene:
      "a small tree of life diagram branching from one root node into three small distinct leaves",
    topic: "evolution by natural selection",
  },
}

const DEFAULT_SCENE: SceneLibraryEntry = {
  scene:
    "an abstract educational diagram with a few connected rounded shapes and one arrow showing flow",
  topic: "general education",
}

function pickScene(title: string): SceneLibraryEntry {
  const normalized = normalizeTitle(title)
  const key = matchSceneKey(normalized)
  if (key && SCENE_LIBRARY[key]) return SCENE_LIBRARY[key]!
  return DEFAULT_SCENE
}

/**
 * Build the actual prompt for fal. The same structure Hermes used to
 * generate the ASD / math9 covers: vector/soft 3D, single concrete
 * scene, pure white background, no text, no card, no border, no frame.
 */
function buildPrompt(scene: SceneLibraryEntry, palette: Palette): string {
  return (
    `A minimalist 2D educational illustration of: ${scene.scene}. ` +
    `Style: clean flat vector with subtle soft 3D shapes, no outlines, ` +
    `no borders, no frames, no drop shadows, no gradients, no patterns. ` +
    `Color palette: ${palette.tokens}. ` +
    `The subject is centered and isolated on a solid pure white background, ` +
    `with no card, no app icon shape, no square or rounded rectangle frame ` +
    `around it, no extra elements, no scenery, no people, no faces, no hands, ` +
    `no landscape, no photo elements. ` +
    `The image is absolutely empty of any text, letters, digits, numbers, ` +
    `formulas, labels, watermarks, characters, glyphs, or symbols of any kind. ` +
    `Concept reference (for the artist only, do not depict literally): ${scene.topic}.`
  )
}

function isFalConfigured(): boolean {
  return Boolean(process.env.FAL_KEY?.trim())
}

async function callFal(prompt: string): Promise<Buffer | null> {
  if (!isFalConfigured()) {
    console.warn("[image-gen] FAL_KEY not set, skipping image generation")
    return null
  }
  fal.config({ credentials: process.env.FAL_KEY!.trim() })

  // Primary: GPT Image 2 at square (816x816) + quality=low. ~$0.005/image.
  try {
    // The client's generic subscribe<T extends EndpointType> is too strict when
    // the endpoint id is a variable (it can't infer the input type from the
    // endpoint). We intentionally use `as any` here — the same inputs work
    // against the live endpoint and any mismatch surfaces as a runtime
    // response error, not a TS type error.
    const result = await (fal.subscribe as (id: string, opts: unknown) => Promise<unknown>)(
      FAL_MODEL,
      {
        input: {
          prompt,
          image_size: "square",
          quality: "low",
          num_images: 1,
          output_format: "png",
        },
        logs: false,
      },
    )

    const url = (result as { data?: { images?: Array<{ url?: string }> } }).data?.images?.[0]?.url
    if (url) {
      const buf = await downloadToBuffer(url)
      if (buf) return buf
    }
  } catch (err) {
    console.warn(
      `[image-gen] ${FAL_MODEL} failed:`,
      err instanceof Error ? err.message : err,
    )
  }

  // Fallback: Flux Schnell at square (512x512). ~$0.003/image.
  try {
    const result = await (fal.subscribe as (id: string, opts: unknown) => Promise<unknown>)(
      FAL_MODEL_FALLBACK,
      {
        input: {
          prompt,
          image_size: "square",
          num_inference_steps: 4,
          num_images: 1,
          output_format: "png",
        },
        logs: false,
      },
    )

    const url = (result as { data?: { images?: Array<{ url?: string }> } }).data?.images?.[0]?.url
    if (url) {
      const buf = await downloadToBuffer(url)
      if (buf) return buf
    }
  } catch (err) {
    console.warn(
      `[image-gen] ${FAL_MODEL_FALLBACK} failed:`,
      err instanceof Error ? err.message : err,
    )
  }

  return null
}

async function downloadToBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) return null
    const arrayBuf = await res.arrayBuffer()
    return Buffer.from(arrayBuf)
  } catch {
    return null
  }
}

async function generateOne(title: string, palette: Palette): Promise<Buffer | null> {
  const scene = pickScene(title)
  const prompt = buildPrompt(scene, palette)

  for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt += 1) {
    const buf = await callFal(prompt)
    if (buf && buf.length > 1000) return buf
  }
  return null
}

function safePathSegment(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "cover"
  )
}

async function uploadToStorage(
  bucketPath: string,
  buf: Buffer,
): Promise<string | null> {
  const admin = createAdminClient()
  for (let attempt = 0; attempt < MAX_UPLOAD_RETRIES; attempt += 1) {
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(bucketPath, buf, {
        contentType: "image/png",
        cacheControl: "31536000, immutable",
        upsert: true,
      })
    if (!error) {
      const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(bucketPath)
      return data.publicUrl
    }
    console.warn(
      `[image-gen] upload attempt ${attempt + 1} failed:`,
      error.message,
    )
  }
  return null
}

/**
 * Generate a chapter icon (cover) for a personalized course using the
 * given palette. The palette is shared with every lesson in the course so
 * the whole course reads as a single visual family.
 */
export async function generateChapterCover(
  userId: string,
  chapterId: string,
  chapterTitle: string,
  palette: Palette,
): Promise<string | null> {
  const buf = await generateOne(chapterTitle, palette)
  if (!buf) return null
  const path = `personalized/${safePathSegment(userId)}/${safePathSegment(chapterId)}/cover.png`
  return uploadToStorage(path, buf)
}

/**
 * Generate a cover image for a single lesson using the chapter's palette.
 * The same palette as the chapter cover so the whole course is one family.
 */
export async function generateLessonCover(
  userId: string,
  chapterId: string,
  lessonId: string,
  lessonTitle: string,
  palette: Palette,
): Promise<string | null> {
  const buf = await generateOne(lessonTitle, palette)
  if (!buf) return null
  const path =
    `personalized/${safePathSegment(userId)}/${safePathSegment(chapterId)}/` +
    `lessons/${safePathSegment(lessonId)}.png`
  return uploadToStorage(path, buf)
}

/**
 * Pick one palette for the whole chapter and generate all cover images in
 * parallel: 1 chapter icon + N lesson covers, all sharing the exact same
 * 2-3 colors. Per-image failures are non-fatal — the lesson still saves,
 * it just won't have an image. Returns the public URLs plus the chosen
 * palette so the caller can persist it on the chapter row.
 */
export async function generateCourseCovers(
  userId: string,
  chapterId: string,
  chapterTitle: string,
  lessons: Array<{ id: string; title: string; orderIndex: number }>,
): Promise<{
  chapterIconUrl: string | null
  lessonImageUrls: Record<string, string>
  palette: Palette
}> {
  // ONE palette for the entire chapter — every image uses the same 2-3 colors.
  const palette = pickPaletteForChapter(chapterId)

  const results = await Promise.all([
    generateChapterCover(userId, chapterId, chapterTitle, palette),
    ...lessons.map((lesson) =>
      generateLessonCover(userId, chapterId, lesson.id, lesson.title, palette),
    ),
  ])

  const chapterIconUrl = results[0]
  const lessonImageUrls: Record<string, string> = {}
  for (let i = 0; i < lessons.length; i += 1) {
    const url = results[i + 1]
    if (url) lessonImageUrls[lessons[i]!.id] = url
  }

  return { chapterIconUrl, lessonImageUrls, palette }
}

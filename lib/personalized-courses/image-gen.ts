import "server-only"

import { fal } from "@fal-ai/client"
import { createAdminClient } from "@/lib/supabaseAdmin"

const FAL_MODEL = "fal-ai/gpt-image-2"
const FAL_MODEL_FALLBACK = "fal-ai/flux/schnell"
const STORAGE_BUCKET = "lesson-images"
const MAX_GENERATION_RETRIES = 2
const MAX_UPLOAD_RETRIES = 2

/**
 * Cover image generation for personalized courses.
 *
 * Pipeline:
 *   1. For each (chapter, lesson) we pick a SCENE_LIBRARY entry that maps
 *      Romanian lesson titles to a concrete English scene description
 *      (e.g. "a metal spring being stretched by a heavy weight"). When no
 *      library rule matches, we fall back to a literal-subject prompt that
 *      names the actual chapter topic — so "Jujutsu Kaisen" gets a stylized
 *      cursed-energy icon, not a generic open-book.
 *   2. We pass the scene to fal.ai's `gpt-image-2` (square 816x816,
 *      quality=low) with a prompt that pushes for SPECIFIC recognizable
 *      objects (not abstract metaphors), 3D rendering with soft shadows,
 *      and a strict duotone palette. Falls back to `flux/schnell` 512x512
 *      on error.
 *   3. We upload the PNG to Supabase storage and return the public URL.
 *
 * Variety: within a single course, we track which scene keys have been used
 * and rotate through a fallback list when the natural pick has already
 * appeared. So 4 lessons in a narrow chapter still get 4 distinct icons.
 *
 * Cost: ~$0.005/image. 1 chapter + 4 lessons = 5 × $0.005 = $0.025 / course.
 */

type Palette = {
  name: string
  /** Short, vivid chunk for the prompt — what the artist should actually use. */
  tokens: string
  /** Accent (stored on chapter.accent_color) used for UI ribbons/badges. */
  accent: string
}

/**
 * Duotone-ish palettes tuned to the Planck 3D-card style. Each palette is
 * one deep saturated primary + one warm accent + one pale tint + near-white.
 * Four options so consecutive chapters still get a varied distribution.
 */
const PALETTES: Palette[] = [
  {
    name: "plum_amber",
    tokens:
      "rich deep plum (#5B2A86) for the main shapes, soft amber (#F4A93D) for accent highlights, pale lavender (#E8DFF5) for light fills, near-white (#FAFAFA) for the background — no other colors",
    accent: "#5B2A86",
  },
  {
    name: "teal_coral",
    tokens:
      "deep teal (#117A78) for the main shapes, warm coral (#E76F51) for accent highlights, pale aqua (#D6EEEC) for light fills, near-white (#FAFAFA) for the background — no other colors",
    accent: "#117A78",
  },
  {
    name: "indigo_gold",
    tokens:
      "deep indigo (#2A3D9C) for the main shapes, warm gold (#E0A800) for accent highlights, pale periwinkle (#DDE2F5) for light fills, near-white (#FAFAFA) for the background — no other colors",
    accent: "#2A3D9C",
  },
  {
    name: "forest_amber",
    tokens:
      "deep forest green (#1F7A4D) for the main shapes, bright amber (#F26A21) for accent highlights, pale mint (#DCEEE6) for light fills, near-white (#FAFAFA) for the background — no other colors",
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

// =====================================================================
// Scene matching
// =====================================================================

/**
 * Scene-match rules. Each rule's `any` tokens are checked with OR: the rule
 * matches if the title contains at least one of them. `priority` breaks ties
 * so specific rules (e.g. `ecuatii_grad2`) still beat generic ones
 * (e.g. `ecuatii_generale`).
 *
 * Order in the array does NOT matter — scoring does.
 */
type SceneRule = {
  key: string
  /** OR within the rule. Match if the title contains at least one token. */
  any: string[]
  /** Higher = preferred when multiple rules match. Specific > generic. */
  priority: number
}

const SCENE_RULES: SceneRule[] = [
  // ---- Lesson-purpose rules (fire on the lesson's role, not the topic) ----
  // These have HIGHER priority than topic rules so an "Introducere in X"
  // lesson always gets an intro icon, not a python_intro icon. The role
  // rules also fallback to the chapter's topic in pickScene() so the icon
  // is still recognizable as part of the right course.
  { key: "intro_lesson", any: ["introducere", "notiuni", "bazele", "ce este", "definitie", " teoria"], priority: 50 },
  { key: "applications", any: ["probleme recapitul", "recapitul", " probleme", "aplicatii", "exercit"], priority: 50 },
  { key: "methods_techniques", any: ["metode de", "tehnici", "tehnica", " metode"], priority: 50 },

  // ---- Informatics ----
  { key: "complexitate", any: ["complexitate"], priority: 10 },
  { key: "cautare", any: ["cautare", "cauta", "binar", "liniar"], priority: 10 },
  { key: "sortare_eficienta", any: ["merge", "quick", "eficienta", "heapsort"], priority: 11 },
  { key: "sortare_bubble", any: ["sortare", "sortar", "bubble", "selection", "insertion"], priority: 10 },
  { key: "recursiv", any: ["recursiv", "recursi"], priority: 10 },
  { key: "stive", any: ["stiv", "stack"], priority: 10 },
  { key: "cozi", any: ["coz", "coada", "queue"], priority: 10 },
  { key: "liste", any: ["lista", "lantuit", "linked"], priority: 10 },
  { key: "arbori", any: ["arbore", "arboresc", "bst"], priority: 10 },
  { key: "hash", any: ["hash", "hashing", "tabela de dispers"], priority: 10 },
  { key: "dijkstra", any: ["dijkstra", "shortest", "drum minim", "bellman"], priority: 11 },
  { key: "bfs_dfs", any: ["bfs", "dfs", "parcurgeri", "parcurgere"], priority: 10 },
  { key: "grafuri", any: ["graf", "grafur"], priority: 10 },
  { key: "dinamica", any: ["dinamic", "dp "], priority: 10 },
  { key: "algoritm", any: ["algoritm"], priority: 10 },
  { key: "python_intro", any: ["python"], priority: 10 },
  { key: "functii_python", any: ["functii python", "functia python", "in python", "cu python"], priority: 10 },

  // ---- Math — algebra & analysis ----
  { key: "ecuatii_grad2", any: ["grad", "patratic", "discriminant", "viete"], priority: 12 },
  { key: "ecuatii_generale", any: ["ecuat", "ecuaț"], priority: 10 },
  { key: "functii_grad2", any: ["parabola", "varf", "radacin", "radacini"], priority: 12 },
  { key: "aplicatii_trig", any: ["triunghi", "geometr"], priority: 11 },
  { key: "functii_trig", any: ["trigonometr", "sinus", "cosinus", "tangenta", " secanta", "cosecanta"], priority: 10 },
  { key: "functii_generale", any: ["funct", "elementar"], priority: 9 },
  { key: "progresii", any: ["progresi", "aritmetic", "geometric", "sirur", "serie"], priority: 10 },
  { key: "inegalitati", any: ["inegalit", "inecua"], priority: 10 },
  { key: "numere_reale", any: ["numere reale", "reale", "proprietat"], priority: 10 },
  { key: "integrale", any: ["integrala", "integrale", "integrare", "primitiva", "primitive"], priority: 10 },
  { key: "derivate", any: ["derivat", "diferentia", "limita", "limite"], priority: 10 },

  // ---- Physics ----
  { key: "hooke", any: ["hooke", "modulul young", "modul young"], priority: 12 },
  { key: "elasticitate", any: ["elastic", "deform", "tensiune mecanica"], priority: 10 },
  { key: "forta_echilibru", any: ["fort", "echilibr"], priority: 10 },
  { key: "circuite", any: ["circuit", "electric", "ohm"], priority: 10 },
  { key: "schimbari_de_stare", any: ["schimb de stare", "schimbari de stare", "faze", "fazele", "tranzitie de faza", "solidificare", "topire", "fierbere", "condensare", "sublimare"], priority: 11 },
  { key: "capacitate_termica", any: ["capacitatea caloric", "capacitat", "caldura specifica", "caldura latent"], priority: 11 },
  { key: "ecuatia_calorimetrica", any: ["ecuatia calorimetr", "ec calorimetr"], priority: 12 },
  { key: "termodinamica", any: ["termodinam", "caldur", "calorimetr", "temperatura"], priority: 10 },
  { key: "unda", any: ["unda", "sunet", "oscilat"], priority: 10 },
  { key: "optica", any: ["optic", "lumin", "reflex", "refract"], priority: 10 },
  { key: "magnetism", any: ["magnet", "cimp", "câmp"], priority: 10 },
  { key: "energie", any: ["energie", "lucru", "mecan", "putere"], priority: 10 },
  { key: "miscare", any: ["miscare", "cinemat", "viteza", "accelerat", "traiector", "rectilini", " cadere libera"], priority: 10 },

  // ---- Chemistry ----
  { key: "legaturi_chimice", any: ["legatur", "chimic", "covalen", "ionic"], priority: 10 },
  { key: "reactii", any: ["reacti", "reactia", "reactant", "produsi de react"], priority: 10 },
  { key: "tabelul_periodic", any: ["tabel", "periodic", "grupe", "grupa"], priority: 10 },
  { key: "solutii", any: ["solut", "concentr", "diluare"], priority: 10 },
  { key: "acizi_baze", any: ["acid", "baza", "ph"], priority: 10 },

  // ---- Biology ----
  { key: "celula", any: ["celul", "tesut", "membrana", "organita"], priority: 10 },
  { key: "dna", any: ["dna", "adn", "genetic", "cromozom", "genom", "mitocond"], priority: 10 },
  { key: "ecosistem", any: ["ecosistem", "biom", "habitat", "flora", "fauna"], priority: 10 },
  { key: "photosinteza", any: ["fotosintez", "clorofil", "cloroplast"], priority: 10 },
  { key: "sistem_nervos", any: ["nervos", "creier", "neuron", "sinaps"], priority: 10 },
  { key: "evolutie", any: ["evolut", "select", "natural", "darwin", "adaptar"], priority: 10 },
]

function matchSceneKey(normalized: string): string | null {
  let best: { key: string; priority: number; hits: number } | null = null
  for (const rule of SCENE_RULES) {
    let hits = 0
    for (const token of rule.any) {
      if (normalized.includes(token)) hits += 1
    }
    if (hits === 0) continue
    if (!best || rule.priority > best.priority || (rule.priority === best.priority && hits > best.hits)) {
      best = { key: rule.key, priority: rule.priority, hits }
    }
  }
  return best?.key ?? null
}

function isGenericKey(key: string): boolean {
  return (
    key === "intro_lesson" ||
    key === "applications" ||
    key === "methods_techniques" ||
    key === "default"
  )
}

// =====================================================================
// Scene library
// =====================================================================

type SceneLibraryEntry = {
  /** Concrete, recognizable scene. Single sentence. Specific objects, not abstract metaphors. */
  scene: string
  /** Plain-English subject name used as the prompt's "concept reference". */
  topic: string
}

/**
 * Each scene names a SPECIFIC, RECOGNIZABLE OBJECT — a real bar chart, a
 * real coiled spring, a real tree, a real beaker — not an "abstract icon"
 * or "diagram". The model needs the concrete noun to draw something
 * the user can recognize as the lesson's actual subject.
 */
const SCENE_LIBRARY: Record<string, SceneLibraryEntry> = {
  // ---- Lesson-purpose scenes (used when a lesson is generic but the
  // chapter has a real topic — pickScene() substitutes the chapter topic
  // into the topic slot so the icon is still recognizable).
  intro_lesson: {
    scene:
      "a stylized open book lying flat with its pages fanned open, a small glowing question-mark shape rising from the center page like a thought bubble",
    topic: "an introduction",
  },
  applications: {
    scene:
      "a stack of three small lined note cards held together by a paperclip, the top card showing a glowing checkmark",
    topic: "applications and solved problems",
  },
  methods_techniques: {
    scene:
      "a small workshop pegboard with three different smooth tool silhouettes hanging from it, each glowing softly in turn",
    topic: "methods and techniques",
  },

  // ---- Informatics ----
  algoritm: {
    scene:
      "a sequence of four connected rounded process boxes arranged left-to-right with arrows between them, the first three boxes being deep saturated color and the last box being a bright accent color with a checkmark inside it, like a process flow diagram",
    topic: "what an algorithm is — a step-by-step process",
  },
  complexitate: {
    scene:
      "a row of small dots ascending in a smooth curve from bottom-left to top-right, with a small speedometer dial at the bottom right showing the needle in the high zone",
    topic: "time and space complexity",
  },
  recursiv: {
    scene:
      "a small spiral made of three nested rounded squares, the smallest inside the next, with a small curved arrow looping from the outer square back to the inner one",
    topic: "recursion — a function calling itself",
  },
  cautare: {
    scene:
      "a horizontal row of small rounded boxes, a magnifying glass hovering over one of them and making it glow, with a split-path arrow showing the search halving at each step",
    topic: "linear and binary search",
  },
  sortare_bubble: {
    scene:
      "four vertical bars of different heights in a row, the third bar from the left glowing in the accent color, with a small curved arrow above it indicating it just got swapped with its neighbor",
    topic: "bubble, selection, and insertion sort",
  },
  sortare_eficienta: {
    scene:
      "a small array of bars at the top that splits into two halves going down, then merges into a single sorted row of bars at the bottom, with arrows showing the divide-and-merge flow",
    topic: "efficient sorting — merge sort, quick sort",
  },
  stive: {
    scene:
      "a vertical stack of four smooth cubes balanced on top of each other, with a fifth cube hovering just above the top and a small downward arrow pushing it onto the stack",
    topic: "a stack — last in, first out",
  },
  cozi: {
    scene:
      "a horizontal row of four smooth cubes lined up one behind the other, with a small arrow on the right showing the front cube leaving the queue",
    topic: "a queue — first in, first out",
  },
  liste: {
    scene:
      "three small circular nodes in a horizontal row connected by short arrows, with a fourth node hovering between two of them as if being inserted into the chain",
    topic: "a linked list",
  },
  arbori: {
    scene:
      "a small tree made of circles and thin lines, with one root circle at the top, two child circles below it, and two more child circles below those, like a binary search tree",
    topic: "a binary search tree",
  },
  hash: {
    scene:
      "a small key shape on the left pointing at a 2x2 grid of rounded square buckets on the right, with one bucket glowing softly in the accent color as the destination",
    topic: "a hash table",
  },
  grafuri: {
    scene:
      "six small circular nodes scattered in a loose network and connected by thin lines, with one node glowing softly in the accent color as the source",
    topic: "a graph data structure",
  },
  dijkstra: {
    scene:
      "a small network of six circular nodes connected by thin lines, with one path between two opposite nodes drawn thicker and glowing softly in the accent color as the shortest path",
    topic: "Dijkstra's shortest path algorithm",
  },
  bfs_dfs: {
    scene:
      "a small network of six circular nodes, with a soft wave of glow spreading outward from one node to its neighbors, like a breadth-first search",
    topic: "graph traversals — BFS and DFS",
  },
  dinamica: {
    scene:
      "a 3x3 grid of small rounded tiles, with three tiles along the main diagonal glowing softly in the accent color, like a memoization table",
    topic: "dynamic programming",
  },
  python_intro: {
    scene:
      "two stacked rounded rectangles resembling a small code editor window, with a soft glowing dot on the left margin like a prompt cursor and a few short horizontal lines inside like code",
    topic: "an introduction to Python",
  },
  functii_python: {
    scene:
      "a small rounded box with an arrow going in on the left side and another arrow coming out on the right side, like a function taking an input and returning an output",
    topic: "functions in Python",
  },

  // ---- Math ----
  ecuatii_grad2: {
    scene:
      "a balance scale with one small cube on each side, the right cube slightly larger, perfectly balanced, with a soft glow around the scale",
    topic: "quadratic equations",
  },
  ecuatii_generale: {
    scene:
      "a balance scale with one small cube on each side, perfectly balanced, with soft arrows showing the equation being simplified",
    topic: "algebraic equations",
  },
  functii_trig: {
    scene:
      "a circle outline with a small horizontal diameter, a smooth sine wave passing through the circle, and a small angle arc at the center",
    topic: "trigonometric functions — sin, cos, tan",
  },
  aplicatii_trig: {
    scene:
      "a right triangle with a small angle arc at the top vertex and short measurement lines along the two legs",
    topic: "trigonometry in triangles",
  },
  functii_grad2: {
    scene:
      "a smooth U-shaped parabola opening upward, with two small dots at the bottom where the curve crosses an empty horizontal axis, marking the roots",
    topic: "a quadratic function and its parabola",
  },
  functii_generale: {
    scene:
      "two smooth curve ribbons crossing empty axes, with a small glowing dot at the point where they meet",
    topic: "elementary functions",
  },
  progresii: {
    scene:
      "a row of small dots that grow in size from left to right, like a sequence stepping up — three small dots, then three medium dots, then three larger dots",
    topic: "arithmetic and geometric progressions",
  },
  inegalitati: {
    scene:
      "a horizontal number line with a soft glowing segment on the right and two small open circles marking the two ends of the interval",
    topic: "inequalities and intervals",
  },
  numere_reale: {
    scene:
      "a horizontal number line with a few small concentric rings at different points and one point glowing softly in the accent color",
    topic: "the real numbers",
  },
  integrale: {
    scene:
      "a smooth curve above an empty horizontal axis with the area between them softly shaded, and a small arrow along the axis showing the bounds of integration",
    topic: "integrals and the area under a curve",
  },
  derivate: {
    scene:
      "a smooth U-shaped curve with a short straight tangent line touching it at one glowing point on the right slope",
    topic: "derivatives and the tangent line",
  },

  // ---- Physics ----
  hooke: {
    scene:
      "a metal coil spring hanging from a small hook at the top, stretched downward by a heavy weight attached to its bottom end, with a soft glow on the spring showing the force",
    topic: "Hooke's law and Young's modulus",
  },
  elasticitate: {
    scene:
      "a metal coil spring with a small weight attached to the bottom, the spring stretched longer than its natural length, with a soft glow on the coils",
    topic: "elasticity and deformation",
  },
  forta_echilibru: {
    scene:
      "a small wooden plank balanced on a triangular pivot, with one rounded weight on each end, perfectly horizontal, the weights identical in size",
    topic: "forces and equilibrium",
  },
  circuite: {
    scene:
      "a closed loop made of thin smooth wires connecting three small rounded nodes, with one small bulb shape glowing softly at the bottom of the loop",
    topic: "a simple electric circuit",
  },
  termodinamica: {
    scene:
      "a smooth rounded glass container with a few small dots scattered inside moving around randomly, and a small thermometer shape leaning against the right side",
    topic: "thermodynamics and temperature",
  },
  schimbari_de_stare: {
    scene:
      "three states of matter side by side: a small pyramid of stacked cubes on the left (solid), a flat pool of liquid in the middle with a soft wave, and three small floating droplets on the right (gas), connected by a small curved arrow",
    topic: "phase changes between solid, liquid, and gas",
  },
  capacitate_termica: {
    scene:
      "a smooth rounded container half filled with liquid, a small soft heat-glow rising from the surface of the liquid",
    topic: "heat capacity and specific heat",
  },
  ecuatia_calorimetrica: {
    scene:
      "a balance scale with a small flame shape on the left pan and a small ice cube on the right pan, perfectly balanced, like a heat exchange",
    topic: "the calorimetry heat-balance equation",
  },
  unda: {
    scene:
      "a smooth sine wave with three soft peaks, a small amplitude arc above the central peak, and a tiny dot moving along the wave",
    topic: "waves and sound",
  },
  optica: {
    scene:
      "a smooth glass lens shape in the center, with one thin line entering on the left, bending through the lens, and converging to a point on the right side",
    topic: "optics — refraction through a lens",
  },
  magnetism: {
    scene:
      "a U-shaped magnet with its two poles facing up, and three curved lines arcing between the poles like magnetic field lines, one line glowing softly in the accent color",
    topic: "magnetism and magnetic fields",
  },
  energie: {
    scene:
      "a smooth sphere sitting at the top of a small curved hill, with a small arrow rolling down the slope, gaining speed",
    topic: "energy, work, and power",
  },
  miscare: {
    scene:
      "three smooth spheres in a horizontal row, the leftmost small, the middle one larger, the rightmost slightly blurred with a small motion arrow, showing acceleration",
    topic: "motion — speed, velocity, acceleration",
  },

  // ---- Chemistry ----
  legaturi_chimice: {
    scene:
      "a small molecular model with three soft spheres connected by short smooth rods forming a triangle, like a tiny molecule",
    topic: "chemical bonds",
  },
  reactii: {
    scene:
      "two small soft sphere clusters on the left side, a small plus sign between them, a small arrow pointing right, and one larger cluster on the right side, like a chemical reaction",
    topic: "chemical reactions",
  },
  tabelul_periodic: {
    scene:
      "a 3x4 grid of small rounded squares, one square in the center glowing softly in the accent color, like a periodic-table excerpt",
    topic: "the periodic table of elements",
  },
  solutii: {
    scene:
      "a smooth glass beaker half filled with liquid, with three small dots dissolving inside the liquid",
    topic: "solutions and concentration",
  },
  acizi_baze: {
    scene:
      "a horizontal pH scale bar with a small glowing dot near the center, a tiny droplet shape on the left (acid) and another on the right (base)",
    topic: "acids, bases, and pH",
  },

  // ---- Biology ----
  celula: {
    scene:
      "a soft rounded cell shape with a small inner circle as the nucleus and a few tiny dots scattered around it as organelles",
    topic: "the living cell",
  },
  dna: {
    scene:
      "a short double-helix ribbon twisting upward, with a small segment glowing softly in the accent color",
    topic: "DNA and genetics",
  },
  ecosistem: {
    scene:
      "a small landscape with one rounded tree silhouette, two tiny animal shapes beside it, and a small circle sun in the upper corner",
    topic: "ecosystems and habitats",
  },
  photosinteza: {
    scene:
      "a smooth green leaf shape with a small sun above it and a soft curved arrow showing the flow of light into the leaf",
    topic: "photosynthesis",
  },
  sistem_nervos: {
    scene:
      "a smooth brain shape on the left connected by a thin line to a small cluster of three tiny circles on the right, like a brain and a nerve network",
    topic: "the nervous system",
  },
  evolutie: {
    scene:
      "a small tree-of-life diagram starting from one root circle at the bottom and branching up into three distinct rounded leaf shapes",
    topic: "evolution by natural selection",
  },
}

/**
 * Default scene used when nothing matches AND we don't have a chapter
 * subject to fall back on. Generic but at least depicts a recognizable
 * concept (a lightbulb = "idea"/"learning").
 */
const DEFAULT_SCENE: SceneLibraryEntry = {
  scene:
    "a smooth rounded lightbulb shape with a small filament inside, glowing softly in the accent color, like an idea or a moment of learning",
  topic: "a general educational concept",
}

// =====================================================================
// Pickers
// =====================================================================

/**
 * Try to extract a clean subject noun phrase from a chapter title. Strips
 * common Romanian boilerplate prefixes so "Curs complet despre Chainsaw
 * Man" → "Chainsaw Man" and "Curs de Integrale" → "Integrale".
 */
function topicForChapter(chapterTitle: string | undefined): string | null {
  if (!chapterTitle) return null
  const cleaned = chapterTitle
    // Order matters — most specific patterns first.
    .replace(/\bcurs\s+complet\s+despre\b/gi, "")
    .replace(/\bcurs\s+completat?\s+despre\b/gi, "")
    .replace(/\bcurs\s+de\b/gi, "")
    .replace(/\bcurs\s+personalizat\b/gi, "")
    .replace(/\bcurs\s+particularizat\b/gi, "")
    .replace(/\b(?:curs|lectie|lectii|capitol)\b/gi, "")
    .replace(/^(?:vreau\s+(?:sa\s+)?invat\s+(?:despre\s+)?)/i, "")
    .replace(/^(?:invata|invat)\s+/i, "")
    .replace(/^(?:complet|completat)\s+(?:despre\s+)?/i, "")
    .replace(/^despre\s+/i, "")
    .replace(/[-–—:].*$/g, "")
    .replace(/[()].*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned.length >= 3 ? cleaned : null
}

/**
 * Build a scene entry that names the chapter's actual subject LITERALLY
 * (not via a library key). Used when no rule matches — the user gets an
 * image of their actual subject instead of a generic icon.
 *
 * If the lesson has a non-trivial title (e.g. "Personaje și Tehnici"),
 * we prepend the lesson's own keywords so each lesson gets a slightly
 * different angle on the same subject. This keeps the chapter visually
 * cohesive (every lesson is "of Jujutsu Kaisen") but distinct.
 */
function literalSubjectScene(
  chapterSubject: string,
  lessonTitle?: string,
): SceneLibraryEntry {
  // Pull out the salient nouns from the lesson title so the prompt says
  // "the characters and techniques of Jujutsu Kaisen" instead of just
  // "Jujutsu Kaisen" for every lesson. Skip short / common words.
  const STOP_WORDS = new Set([
    "si", "de", "la", "in", "cu", "pe", "din", "despre", "the", "a", "an",
    "ce", "este", "introducere", "intro", "notiuni", "bazele", "definitie",
    "aplicatii", "recapitul", "probleme", "exercit", "metode",
    "tehnici", "tehnica", "lectie", "lectia", "lectii", "capitol",
  ])

  let lessonFocus = ""
  if (lessonTitle) {
    const norm = normalizeTitle(lessonTitle)
    const words = norm.split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    // Drop words that are already in the chapter subject to avoid "Jujutsu
    // Kaisen - Jujutsu Kaisen".
    const subjNorm = normalizeTitle(chapterSubject)
    const unique = words.filter((w) => !subjNorm.includes(w))
    if (unique.length > 0) {
      // Cap at 4 words so the prompt doesn't get too long.
      lessonFocus = unique.slice(0, 4).join(" ")
    }
  }

  const focusPhrase = lessonFocus ? `focusing on ${lessonFocus} of` : "depicting"
  return {
    scene: `a stylized 3D icon ${focusPhrase} the subject "${chapterSubject}" — show a recognizable object, character, symbol, or scene that represents this topic using the same composition rules as the other illustrations`,
    topic: `the subject "${chapterSubject}"${lessonFocus ? ` — ${lessonFocus}` : ""}`,
  }
}

/**
 * Pick a scene for one lesson. Tries the lesson title first; if the lesson
 * is a generic role (intro/applications/methods) AND the chapter resolves
 * to a real topic, the topic is injected so the icon is still recognizable.
 *
 * If no rule matches and the chapter subject can't be determined either,
 * returns the DEFAULT_SCENE.
 */
function pickScene(lessonTitle: string, chapterTitle?: string): SceneLibraryEntry {
  const lessonNorm = normalizeTitle(lessonTitle)
  const lessonKey = matchSceneKey(lessonNorm)
  const isGenericRole =
    lessonKey === "intro_lesson" ||
    lessonKey === "applications" ||
    lessonKey === "methods_techniques"

  const chapterNorm = chapterTitle ? normalizeTitle(chapterTitle) : ""
  const chapterTopic = topicForChapter(chapterTitle)
  const chapterTopicNorm = chapterTopic ? normalizeTitle(chapterTopic) : ""
  const chapterKey =
    matchSceneKey(chapterNorm) ?? (chapterTopicNorm ? matchSceneKey(chapterTopicNorm) : null)

  // Case 1: lesson is a generic role but the chapter has a real topic —
  // use the topic rule so the icon is recognizable.
  if (isGenericRole && chapterKey && !isGenericKey(chapterKey) && SCENE_LIBRARY[chapterKey]) {
    return SCENE_LIBRARY[chapterKey]!
  }

  // Case 2: lesson is a generic role AND the chapter has no specific topic
  // rule (e.g. "Jujutsu Kaisen"). Use the literal-subject scene so the
  // user gets an icon of their actual subject instead of "open book with ?".
  if (isGenericRole && chapterTopic) {
    return literalSubjectScene(chapterTopic, lessonTitle)
  }

  // Case 3: lesson has its own specific topic rule — use it.
  if (lessonKey && SCENE_LIBRARY[lessonKey]) {
    return SCENE_LIBRARY[lessonKey]!
  }

  // Case 4: chapter has a topic rule, use it.
  if (chapterKey && SCENE_LIBRARY[chapterKey]) {
    return SCENE_LIBRARY[chapterKey]!
  }

  // Case 5: nothing matched but we have a chapter subject — describe the
  // subject literally so the user gets an icon of their actual topic.
  if (chapterTopic) {
    return literalSubjectScene(chapterTopic, lessonTitle)
  }

  return DEFAULT_SCENE
}

/**
 * Resolve the same scene key the picker would pick, without returning the
 * entry. Used to track which keys have been used in a course.
 */
function sceneKeyFor(lessonTitle: string, chapterTitle?: string): string | null {
  const lessonNorm = normalizeTitle(lessonTitle)
  const lessonKey = matchSceneKey(lessonNorm)
  const chapterNorm = chapterTitle ? normalizeTitle(chapterTitle) : ""
  const chapterTopic = topicForChapter(chapterTitle)
  const chapterTopicNorm = chapterTopic ? normalizeTitle(chapterTopic) : ""
  const chapterKey =
    matchSceneKey(chapterNorm) ?? (chapterTopicNorm ? matchSceneKey(chapterTopicNorm) : null)

  const isGenericRole =
    lessonKey === "intro_lesson" ||
    lessonKey === "applications" ||
    lessonKey === "methods_techniques"
  if (isGenericRole && chapterKey && !isGenericKey(chapterKey)) return chapterKey
  if (lessonKey) return lessonKey
  return chapterKey
}

// =====================================================================
// Per-course scene variety
// =====================================================================

/**
 * Per-domain fallback rotations. When the natural pick has already been
 * used by an earlier lesson in the same course, we rotate through a
 * domain-matched fallback list so the chapter's lessons stay
 * topic-consistent.
 */
const FALLBACK_ROTATIONS: Record<string, ReadonlyArray<string>> = {
  stem_math: [
    "functii_generale", "functii_grad2", "ecuatii_generale",
    "numere_reale", "functii_trig", "aplicatii_trig",
    "progresii", "inegalitati", "integrale", "derivate",
    "grafuri", "tabelul_periodic",
  ],
  stem_physics: [
    "energie", "miscare", "unda", "magnetism", "circuite",
    "termodinamica", "schimbari_de_stare", "optica",
    "forta_echilibru", "elasticitate", "hooke",
    "ecuatii_generale", "functii_generale",
  ],
  stem_cs: [
    "complexitate", "algoritm", "grafuri", "arbori",
    "ecuatii_generale", "functii_generale", "tabelul_periodic",
    "recursiv", "sortare_bubble", "cautare", "dinamica",
    "celula", "dna", "magnetism", "unda",
  ],
  stem_chem: [
    "tabelul_periodic", "legaturi_chimice", "reactii",
    "solutii", "acizi_baze",
    "celula", "dna", "numere_reale", "ecuatii_generale",
    "grafuri", "magnetism",
  ],
  stem_bio: [
    "celula", "dna", "ecosistem", "photosinteza",
    "sistem_nervos", "evolutie",
    "tabelul_periodic", "legaturi_chimice",
    "grafuri", "arbori", "dna", "magnetism",
  ],
  generic: [
    "complexitate", "algoritm", "ecuatii_generale",
    "functii_generale", "functii_grad2",
    "tabelul_periodic", "celula", "dna",
    "grafuri", "arbori", "energie", "miscare",
    "magnetism", "circuite", "unda",
  ],
}

function fallbackDomainForChapterKey(chapterKey: string | null): keyof typeof FALLBACK_ROTATIONS {
  if (!chapterKey) return "generic"
  if (
    chapterKey === "ecuatii_generale" || chapterKey === "ecuatii_grad2" ||
    chapterKey === "functii_generale" || chapterKey === "functii_grad2" ||
    chapterKey === "functii_trig" || chapterKey === "aplicatii_trig" ||
    chapterKey === "progresii" || chapterKey === "inegalitati" ||
    chapterKey === "numere_reale" || chapterKey === "integrale" ||
    chapterKey === "derivate"
  ) {
    return "stem_math"
  }
  if (
    chapterKey === "termodinamica" || chapterKey === "schimbari_de_stare" ||
    chapterKey === "capacitate_termica" || chapterKey === "ecuatia_calorimetrica" ||
    chapterKey === "elasticitate" || chapterKey === "hooke" ||
    chapterKey === "forta_echilibru" || chapterKey === "circuite" ||
    chapterKey === "unda" || chapterKey === "optica" ||
    chapterKey === "magnetism" || chapterKey === "energie" ||
    chapterKey === "miscare"
  ) {
    return "stem_physics"
  }
  if (
    chapterKey === "algoritm" || chapterKey === "complexitate" ||
    chapterKey === "recursiv" || chapterKey === "cautare" ||
    chapterKey === "sortare_bubble" || chapterKey === "sortare_eficienta" ||
    chapterKey === "stive" || chapterKey === "cozi" || chapterKey === "liste" ||
    chapterKey === "arbori" || chapterKey === "hash" ||
    chapterKey === "grafuri" || chapterKey === "dijkstra" ||
    chapterKey === "bfs_dfs" || chapterKey === "dinamica" ||
    chapterKey === "python_intro" || chapterKey === "functii_python"
  ) {
    return "stem_cs"
  }
  if (
    chapterKey === "legaturi_chimice" || chapterKey === "reactii" ||
    chapterKey === "tabelul_periodic" || chapterKey === "solutii" ||
    chapterKey === "acizi_baze"
  ) {
    return "stem_chem"
  }
  if (
    chapterKey === "celula" || chapterKey === "dna" ||
    chapterKey === "ecosistem" || chapterKey === "photosinteza" ||
    chapterKey === "sistem_nervos" || chapterKey === "evolutie"
  ) {
    return "stem_bio"
  }
  return "generic"
}

function pickSceneForCourse(
  lessonTitle: string,
  chapterTitle: string | undefined,
  usedKeys: Set<string>,
  lessonIndex: number,
): SceneLibraryEntry {
  const natural = pickScene(lessonTitle, chapterTitle)
  const naturalKey = sceneKeyFor(lessonTitle, chapterTitle)

  if (naturalKey && !usedKeys.has(naturalKey)) {
    usedKeys.add(naturalKey)
    return natural
  }

  const chapterNorm = chapterTitle ? normalizeTitle(chapterTitle) : ""
  const chapterTopic = topicForChapter(chapterTitle)
  const chapterTopicNorm = chapterTopic ? normalizeTitle(chapterTopic) : ""
  const chapterHasRule =
    Boolean(matchSceneKey(chapterNorm) ?? (chapterTopicNorm ? matchSceneKey(chapterTopicNorm) : null))

  if (!chapterHasRule && chapterTopic) {
    return literalSubjectScene(chapterTopic, lessonTitle)
  }

  const chapterKeyResolved = matchSceneKey(chapterNorm) ?? (chapterTopicNorm ? matchSceneKey(chapterTopicNorm) : null)
  const domain = fallbackDomainForChapterKey(chapterKeyResolved)
  const rotation = FALLBACK_ROTATIONS[domain] ?? FALLBACK_ROTATIONS.generic

  for (let i = 0; i < rotation.length; i += 1) {
    const candidate = rotation[(lessonIndex + i) % rotation.length]!
    if (!usedKeys.has(candidate) && SCENE_LIBRARY[candidate]) {
      usedKeys.add(candidate)
      return SCENE_LIBRARY[candidate]!
    }
  }

  if (chapterTopic) {
    return literalSubjectScene(chapterTopic, lessonTitle)
  }

  return DEFAULT_SCENE
}

// Exported for unit tests.
export const _internal = {
  pickScene,
  pickSceneForCourse,
  matchSceneKey,
  normalizeTitle,
  topicForChapter,
  literalSubjectScene,
}

// =====================================================================
// Prompt
// =====================================================================

/**
 * Build the actual prompt for fal. Targets the Planck 3D-card style:
 * a SPECIFIC, RECOGNIZABLE object, a strict duotone palette, soft 3D depth,
 * pure white background, no text.
 */
function buildPrompt(scene: SceneLibraryEntry, palette: Palette): string {
  return (
    `A clear educational icon depicting: ${scene.scene}. ` +
    `Style: 3D rendered illustration, soft realistic materials, rounded smooth shapes, subtle soft drop shadow under the main subject on a near-white surface, subtle soft inner highlights on the rounded surfaces, slight ambient occlusion. ` +
    `Strict duotone palette: ${palette.tokens}. ` +
    `Composition: the subject is centered, occupies about 65-75% of the frame, with generous empty white space around it. ` +
    `No card, no app icon shape, no rounded square frame, no border, no border line, no extra scenery, no background gradient, no pattern, no grid, no landscape, no people, no faces, no hands, no photo elements, no watermarks. ` +
    `Absolutely no text, letters, digits, numbers, formulas, labels, characters, glyphs, or symbols of any kind. ` +
    `Subject reference: ${scene.topic}.`
  )
}

// =====================================================================
// fal.ai call
// =====================================================================

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

async function generateOne(
  title: string,
  palette: Palette,
  chapterTitle?: string,
  precomputedScene?: SceneLibraryEntry,
): Promise<Buffer | null> {
  const scene = precomputedScene ?? pickScene(title, chapterTitle)
  const prompt = buildPrompt(scene, palette)

  for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt += 1) {
    const buf = await callFal(prompt)
    if (buf && buf.length > 1000) return buf
  }
  return null
}

// =====================================================================
// Storage
// =====================================================================

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

// =====================================================================
// Public API
// =====================================================================

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
  precomputedScene?: SceneLibraryEntry,
): Promise<string | null> {
  const buf = await generateOne(chapterTitle, palette, chapterTitle, precomputedScene)
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
  chapterTitle?: string,
  precomputedScene?: SceneLibraryEntry,
): Promise<string | null> {
  const buf = await generateOne(lessonTitle, palette, chapterTitle ?? lessonTitle, precomputedScene)
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
 *
 * Scene variety: each lesson's natural scene key is tracked in a shared set
 * (the chapter cover's key goes in first). When a later lesson would pick a
 * key that's already used, the per-course picker rotates through a fallback
 * set so the lesson thumbnails stay visually distinct.
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

  // Pre-compute every scene with the variety-aware picker so the chapter
  // cover goes first and lesson covers avoid already-used keys.
  const usedKeys = new Set<string>()
  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex)

  const chapterScene = pickScene(chapterTitle, chapterTitle)
  const chapterKey = sceneKeyFor(chapterTitle, chapterTitle)
  if (chapterKey) usedKeys.add(chapterKey)

  const lessonScenes = sortedLessons.map((lesson, i) =>
    pickSceneForCourse(lesson.title, chapterTitle, usedKeys, i),
  )

  const results = await Promise.all([
    generateChapterCover(userId, chapterId, chapterTitle, palette, chapterScene),
    ...sortedLessons.map((lesson, i) =>
      generateLessonCover(
        userId,
        chapterId,
        lesson.id,
        lesson.title,
        palette,
        chapterTitle,
        lessonScenes[i],
      ),
    ),
  ])

  const chapterIconUrl = results[0]
  const lessonImageUrls: Record<string, string> = {}
  for (let i = 0; i < sortedLessons.length; i += 1) {
    const url = results[i + 1]
    if (url) lessonImageUrls[sortedLessons[i]!.id] = url
  }

  return { chapterIconUrl, lessonImageUrls, palette }
}

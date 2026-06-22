/**
 * Interactive learning-path item kinds (stored in learning_path_lesson_items.item_type + content_json).
 */

export const LEARNING_PATH_INTERACTIVE_ITEM_TYPE_LIST = [
  "card_sort",
  "fill_slot",
  "match",
  "graph_build",
  "code_trace",
  "swipe_classify",
  "flow_build",
  "slider_explore",
  "table_fill",
  "memory_flip",
  "speed_round",
  "reveal_steps",
] as const

export type LearningPathInteractiveItemType = (typeof LEARNING_PATH_INTERACTIVE_ITEM_TYPE_LIST)[number]

export function isInteractiveLessonItemType(value: string): value is LearningPathInteractiveItemType {
  return (LEARNING_PATH_INTERACTIVE_ITEM_TYPE_LIST as readonly string[]).includes(value)
}

type Ok<T> = { ok: true; value: T }
type Err = { ok: false; error: string }
type Res<T> = Ok<T> | Err

function err(message: string): Err {
  return { ok: false, error: message }
}

function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function asInt(value: unknown, fallback: number): number {
  const n = asFiniteNumber(value)
  if (n === null) return fallback
  return Math.trunc(n)
}

// --- Public content types (subset used by UI) ---

export interface CardSortContent {
  instructions?: string
  cards: { id: string; text: string }[]
  correctOrder: string[]
}

export interface FillSlotContent {
  instructions?: string
  /** e.g. "F = {{m}} \\cdot a" — placeholders match slot ids */
  latexTemplate: string
  slots: { id: string; answer: string }[]
  chips: string[]
}

export interface MatchContent {
  instructions?: string
  left: { id: string; text: string }[]
  right: { id: string; text: string }[]
  pairs: { leftId: string; rightId: string }[]
}

export type GraphBuildContent =
  | {
      mode: "pick_curve"
      prompt: string
      options: { id: string; label?: string; svgPath: string }[]
      correctOptionId: string
    }
  | {
      mode: "plot_points"
      prompt: string
      grid?: { xMin: number; xMax: number; yMin: number; yMax: number }
      correctPoints: { x: number; y: number }[]
      /** data-space tolerance */
      tolerance: number
    }

export interface CodeTraceContent {
  language?: string
  /** Optional image shown above the code block */
  imageUrl?: string
  lines: string[]
  steps: {
    lineIndex: number
    prompt: string
    inputMode: "choice" | "text"
    options?: string[]
    answer: string
  }[]
}

export interface SwipeClassifyContent {
  prompt?: string
  leftLabel: string
  rightLabel: string
  cards: { text: string; side: "left" | "right" }[]
}

export interface FlowBuildContent {
  instructions?: string
  nodes: { id: string; kind: "start" | "process" | "decision" | "end"; label: string }[]
  correctEdges: { from: string; to: string }[]
}

export interface SliderExploreContent {
  instructions?: string
  sliders: { id: string; label: string; min: number; max: number; step: number; default: number }[]
  formula: string
  targetMin: number
  targetMax: number
}

export interface TableFillContent {
  instructions?: string
  headers: string[]
  rows: { cells: ({ text?: string; blank?: boolean; answer?: string } | null)[] }[]
}

export interface MemoryFlipContent {
  instructions?: string
  pairs: { a: string; b: string }[]
}

export interface SpeedRoundContent {
  secondsTotal: number
  questions: { prompt: string; options: string[]; correctIndex: number }[]
}

export type RevealStepBlock =
  | { kind: "markdown"; content: string }
  | { kind: "quiz"; content?: string; options: string[]; correctIndex: number }

export interface RevealStepsContent {
  instructions?: string
  steps: RevealStepBlock[]
}

export type ParsedInteractiveContent =
  | { itemType: "card_sort"; data: CardSortContent }
  | { itemType: "fill_slot"; data: FillSlotContent }
  | { itemType: "match"; data: MatchContent }
  | { itemType: "graph_build"; data: GraphBuildContent }
  | { itemType: "code_trace"; data: CodeTraceContent }
  | { itemType: "swipe_classify"; data: SwipeClassifyContent }
  | { itemType: "flow_build"; data: FlowBuildContent }
  | { itemType: "slider_explore"; data: SliderExploreContent }
  | { itemType: "table_fill"; data: TableFillContent }
  | { itemType: "memory_flip"; data: MemoryFlipContent }
  | { itemType: "speed_round"; data: SpeedRoundContent }
  | { itemType: "reveal_steps"; data: RevealStepsContent }

function parseCardSort(c: Record<string, unknown>): Res<CardSortContent> {
  const instructions = asString(c.instructions) ?? undefined
  const rawCards = c.cards
  if (!Array.isArray(rawCards) || rawCards.length < 2) {
    return err("card_sort: cards trebuie să fie un array cu minim 2 elemente {id, text}.")
  }
  const cards: { id: string; text: string }[] = []
  const seen = new Set<string>()
  for (const row of rawCards) {
    if (!isRecord(row)) return err("card_sort: fiecare card trebuie să fie obiect.")
    const id = (asString(row.id) || "").trim()
    const text = (asString(row.text) || "").trim()
    if (!id || !text) return err("card_sort: fiecare card necesită id și text.")
    if (seen.has(id)) return err("card_sort: id-uri de card duplicate.")
    seen.add(id)
    cards.push({ id, text })
  }
  const correctOrder = c.correctOrder
  if (!Array.isArray(correctOrder) || correctOrder.length !== cards.length) {
    return err("card_sort: correctOrder trebuie să aibă aceeași lungime ca lista de carduri.")
  }
  const ids = new Set(cards.map((x) => x.id))
  const orderIds: string[] = []
  for (const entry of correctOrder) {
    if (typeof entry !== "string" || !entry.trim()) return err("card_sort: correctOrder conține valori invalide.")
    if (!ids.has(entry.trim())) return err("card_sort: correctOrder referă un id inexistent.")
    orderIds.push(entry.trim())
  }
  if (new Set(orderIds).size !== orderIds.length) return err("card_sort: correctOrder trebuie să fie o permutare validă.")
  return ok({ instructions, cards, correctOrder: orderIds })
}

function parseFillSlot(c: Record<string, unknown>): Res<FillSlotContent> {
  const instructions = asString(c.instructions) ?? undefined
  const latexTemplate = (asString(c.latexTemplate) || "").trim()
  if (!latexTemplate || !latexTemplate.includes("{{")) {
    return err("fill_slot: latexTemplate trebuie să conțină placeholder-e {{slotId}}.")
  }
  const rawSlots = c.slots
  if (!Array.isArray(rawSlots) || rawSlots.length < 1) {
    return err("fill_slot: slots trebuie să fie un array nevid de {id, answer}.")
  }
  const slots: { id: string; answer: string }[] = []
  for (const s of rawSlots) {
    if (!isRecord(s)) return err("fill_slot: slot invalid.")
    const id = (asString(s.id) || "").trim()
    const answer = (asString(s.answer) || "").trim()
    if (!id || !answer) return err("fill_slot: fiecare slot necesită id și answer.")
    slots.push({ id, answer })
  }
  const chipsRaw = c.chips
  if (!Array.isArray(chipsRaw) || chipsRaw.length < 1) {
    return err("fill_slot: chips trebuie să fie un array nevid de string-uri.")
  }
  const chips = chipsRaw.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
  if (chips.length < 1) return err("fill_slot: chips trebuie să conțină cel puțin o valoare.")
  for (const sl of slots) {
    if (!latexTemplate.includes(`{{${sl.id}}}`)) {
      return err(`fill_slot: latexTemplate trebuie să includă {{${sl.id}}}.`)
    }
  }
  return ok({ instructions, latexTemplate, slots, chips })
}

function parseMatch(c: Record<string, unknown>): Res<MatchContent> {
  const instructions = asString(c.instructions) ?? undefined
  const parseSide = (raw: unknown, label: string): Res<{ id: string; text: string }[]> => {
    if (!Array.isArray(raw) || raw.length < 1) return err(`match: ${label} trebuie să fie array nevid.`)
    const out: { id: string; text: string }[] = []
    const seen = new Set<string>()
    for (const row of raw) {
      if (!isRecord(row)) return err(`match: ${label} — element invalid.`)
      const id = (asString(row.id) || "").trim()
      const text = (asString(row.text) || "").trim()
      if (!id || !text) return err(`match: ${label} — id și text obligatorii.`)
      if (seen.has(id)) return err(`match: ${label} — id duplicat.`)
      seen.add(id)
      out.push({ id, text })
    }
    return ok(out)
  }
  const L = parseSide(c.left, "left")
  if (!L.ok) return L
  const R = parseSide(c.right, "right")
  if (!R.ok) return R
  if (L.value.length !== R.value.length) {
    return err("match: stânga și dreapta trebuie să aibă același număr de elemente.")
  }
  const rawPairs = c.pairs
  if (!Array.isArray(rawPairs) || rawPairs.length !== L.value.length) {
    return err("match: pairs trebuie să aibă câte o pereche pentru fiecare rând.")
  }
  const pairs: { leftId: string; rightId: string }[] = []
  const leftIds = new Set(L.value.map((x) => x.id))
  const rightIds = new Set(R.value.map((x) => x.id))
  const usedL = new Set<string>()
  const usedR = new Set<string>()
  for (const p of rawPairs) {
    if (!isRecord(p)) return err("match: pereche invalidă.")
    const leftId = (asString(p.leftId) || "").trim()
    const rightId = (asString(p.rightId) || "").trim()
    if (!leftIds.has(leftId) || !rightIds.has(rightId)) return err("match: pereche cu id inexistent.")
    if (usedL.has(leftId) || usedR.has(rightId)) return err("match: fiecare element poate apărea o singură dată în pairs.")
    usedL.add(leftId)
    usedR.add(rightId)
    pairs.push({ leftId, rightId })
  }
  if (usedL.size !== L.value.length) return err("match: pairs nu acoperă toate elementele din stânga.")
  return ok({ instructions, left: L.value, right: R.value, pairs })
}

function parseGraphBuild(c: Record<string, unknown>): Res<GraphBuildContent> {
  const mode = asString(c.mode)
  const prompt = (asString(c.prompt) || "").trim()
  if (!prompt) return err("graph_build: prompt este obligatoriu.")
  if (mode === "pick_curve") {
    const opts = c.options
    if (!Array.isArray(opts) || opts.length < 2) return err("graph_build (pick_curve): minim 2 opțiuni.")
    const options: { id: string; label?: string; svgPath: string }[] = []
    const seen = new Set<string>()
    for (const o of opts) {
      if (!isRecord(o)) return err("graph_build: opțiune invalidă.")
      const id = (asString(o.id) || "").trim()
      const svgPath = (asString(o.svgPath) || "").trim()
      if (!id || !svgPath) return err("graph_build: fiecare opțiune necesită id și svgPath.")
      if (seen.has(id)) return err("graph_build: id opțiune duplicat.")
      seen.add(id)
      const label = (asString(o.label) || "").trim() || undefined
      options.push({ id, label, svgPath })
    }
    const correctOptionId = (asString(c.correctOptionId) || "").trim()
    if (!correctOptionId || !seen.has(correctOptionId)) {
      return err("graph_build: correctOptionId trebuie să fie unul dintre id-urile opțiunilor.")
    }
    return ok({ mode: "pick_curve", prompt, options, correctOptionId })
  }
  if (mode === "plot_points") {
    const rawPts = c.correctPoints
    if (!Array.isArray(rawPts) || rawPts.length < 1) {
      return err("graph_build (plot_points): correctPoints nevid.")
    }
    const correctPoints: { x: number; y: number }[] = []
    for (const p of rawPts) {
      if (!isRecord(p)) return err("graph_build: punct invalid.")
      const x = asFiniteNumber(p.x)
      const y = asFiniteNumber(p.y)
      if (x === null || y === null) return err("graph_build: fiecare punct are nevoie de x,y numerice.")
      correctPoints.push({ x, y })
    }
    const tol = asFiniteNumber(c.tolerance)
    if (tol === null || tol <= 0) return err("graph_build (plot_points): tolerance > 0 obligatoriu.")
    let grid: { xMin: number; xMax: number; yMin: number; yMax: number } | undefined
    const g = c.grid
    if (g !== undefined && g !== null) {
      if (!isRecord(g)) return err("graph_build: grid invalid.")
      const xMin = asFiniteNumber(g.xMin)
      const xMax = asFiniteNumber(g.xMax)
      const yMin = asFiniteNumber(g.yMin)
      const yMax = asFiniteNumber(g.yMax)
      if (xMin === null || xMax === null || yMin === null || yMax === null || xMax <= xMin || yMax <= yMin) {
        return err("graph_build: grid trebuie xMin<xMax, yMin<yMax.")
      }
      grid = { xMin, xMax, yMin, yMax }
    }
    return ok({ mode: "plot_points", prompt, grid, correctPoints, tolerance: tol })
  }
  return err("graph_build: mode trebuie pick_curve sau plot_points.")
}

function parseCodeTrace(c: Record<string, unknown>): Res<CodeTraceContent> {
  const language = (asString(c.language) || "python").trim()
  const linesRaw = c.lines
  if (!Array.isArray(linesRaw) || linesRaw.length < 1) return err("code_trace: lines trebuie să fie array nevid de string-uri.")
  const lines = linesRaw.map((l) => (typeof l === "string" ? l : ""))
  const stepsRaw = c.steps
  if (!Array.isArray(stepsRaw) || stepsRaw.length < 1) return err("code_trace: steps nevid.")
  const steps: CodeTraceContent["steps"] = []
  for (const s of stepsRaw) {
    if (!isRecord(s)) return err("code_trace: pas invalid.")
    const lineIndex = asInt(s.lineIndex, -1)
    const prompt = (asString(s.prompt) || "").trim()
    const inputMode = asString(s.inputMode) === "text" ? "text" : "choice"
    const answer = (asString(s.answer) || "").trim()
    if (lineIndex < 0 || lineIndex >= lines.length) return err("code_trace: lineIndex în afara liniilor de cod.")
    if (!prompt || !answer) return err("code_trace: prompt și answer obligatorii.")
    let options: string[] | undefined
    if (inputMode === "choice") {
      const ro = s.options
      if (!Array.isArray(ro) || ro.length < 2) return err("code_trace: pentru inputMode choice, options (min 2) sunt obligatorii.")
      options = ro.map((o) => (typeof o === "string" ? o : String(o)))
      if (!options.some((o) => o.trim().toLowerCase() === answer.trim().toLowerCase())) {
        return err("code_trace: answer trebuie să coincidă cu una din opțiuni.")
      }
    }
    steps.push({ lineIndex, prompt, inputMode, options, answer })
  }
  const imageUrlRaw = (asString(c.imageUrl) || asString(c.image_url) || "").trim()
  const imageUrl = imageUrlRaw || undefined
  return ok({ language, ...(imageUrl ? { imageUrl } : {}), lines, steps })
}

function parseSwipe(c: Record<string, unknown>): Res<SwipeClassifyContent> {
  const prompt = asString(c.prompt) ?? undefined
  const leftLabel = (asString(c.leftLabel) || "").trim()
  const rightLabel = (asString(c.rightLabel) || "").trim()
  if (!leftLabel || !rightLabel) return err("swipe_classify: leftLabel și rightLabel obligatorii.")
  const cardsRaw = c.cards
  if (!Array.isArray(cardsRaw) || cardsRaw.length < 1) return err("swipe_classify: cards nevid.")
  const cards: { text: string; side: "left" | "right" }[] = []
  for (const row of cardsRaw) {
    if (!isRecord(row)) return err("swipe_classify: card invalid.")
    const text = (asString(row.text) || "").trim()
    const side = asString(row.side) === "right" ? "right" : "left"
    if (!text) return err("swipe_classify: fiecare card are nevoie de text.")
    cards.push({ text, side })
  }
  return ok({ prompt, leftLabel, rightLabel, cards })
}

function parseFlow(c: Record<string, unknown>): Res<FlowBuildContent> {
  const instructions = asString(c.instructions) ?? undefined
  const rawNodes = c.nodes
  if (!Array.isArray(rawNodes) || rawNodes.length < 2) return err("flow_build: minim 2 noduri.")
  const nodes: FlowBuildContent["nodes"] = []
  const kinds = new Set(["start", "process", "decision", "end"])
  const seen = new Set<string>()
  for (const n of rawNodes) {
    if (!isRecord(n)) return err("flow_build: nod invalid.")
    const id = (asString(n.id) || "").trim()
    const label = (asString(n.label) || "").trim()
    const kind = asString(n.kind) || ""
    if (!id || !label || !kinds.has(kind)) return err("flow_build: fiecare nod are nevoie de id, label și kind valid.")
    if (seen.has(id)) return err("flow_build: id nod duplicat.")
    seen.add(id)
    nodes.push({ id, kind: kind as FlowBuildContent["nodes"][number]["kind"], label })
  }
  const rawEdges = c.correctEdges
  if (!Array.isArray(rawEdges) || rawEdges.length < 1) return err("flow_build: correctEdges nevid.")
  const correctEdges: { from: string; to: string }[] = []
  for (const e of rawEdges) {
    if (!isRecord(e)) return err("flow_build: muchie invalidă.")
    const from = (asString(e.from) || "").trim()
    const to = (asString(e.to) || "").trim()
    if (!from || !to || !seen.has(from) || !seen.has(to)) return err("flow_build: muchiile trebuie să refere noduri existente.")
    correctEdges.push({ from, to })
  }
  return ok({ instructions, nodes, correctEdges })
}

function parseSlider(c: Record<string, unknown>): Res<SliderExploreContent> {
  const instructions = asString(c.instructions) ?? undefined
  const formula = (asString(c.formula) || "").trim()
  if (!formula) return err("slider_explore: formula obligatorie.")
  const rawSliders = c.sliders
  if (!Array.isArray(rawSliders) || rawSliders.length < 1) return err("slider_explore: sliders nevid.")
  const sliders: SliderExploreContent["sliders"] = []
  const ids = new Set<string>()
  for (const s of rawSliders) {
    if (!isRecord(s)) return err("slider_explore: slider invalid.")
    const id = (asString(s.id) || "").trim()
    const label = (asString(s.label) || "").trim()
    const min = asFiniteNumber(s.min)
    const max = asFiniteNumber(s.max)
    const step = asFiniteNumber(s.step)
    const def = asFiniteNumber(s.default)
    if (!id || !label || min === null || max === null || step === null || def === null || max <= min || step <= 0) {
      return err("slider_explore: fiecare slider necesită id, label, min<max, step>0, default în interval.")
    }
    if (def < min || def > max) return err("slider_explore: default trebuie între min și max.")
    if (ids.has(id)) return err("slider_explore: id slider duplicat.")
    ids.add(id)
    sliders.push({ id, label, min, max, step, default: def })
  }
  const targetMin = asFiniteNumber(c.targetMin)
  const targetMax = asFiniteNumber(c.targetMax)
  if (targetMin === null || targetMax === null || targetMax <= targetMin) {
    return err("slider_explore: targetMin < targetMax obligatoriu.")
  }
  return ok({ instructions, sliders, formula, targetMin, targetMax })
}

function parseTable(c: Record<string, unknown>): Res<TableFillContent> {
  const instructions = asString(c.instructions) ?? undefined
  const headersRaw = c.headers
  if (!Array.isArray(headersRaw) || headersRaw.length < 1) return err("table_fill: headers nevid.")
  const headers = headersRaw.map((h) => (typeof h === "string" ? h : ""))
  const rowsRaw = c.rows
  if (!Array.isArray(rowsRaw) || rowsRaw.length < 1) return err("table_fill: rows nevid.")
  const rows: TableFillContent["rows"] = []
  for (const row of rowsRaw) {
    if (!isRecord(row)) return err("table_fill: rând invalid.")
    const cellsRaw = row.cells
    if (!Array.isArray(cellsRaw) || cellsRaw.length !== headers.length) {
      return err("table_fill: fiecare rând trebuie să aibă cells.length === headers.length.")
    }
    const cells: TableFillContent["rows"][number]["cells"] = []
    for (const cell of cellsRaw) {
      if (cell === null) {
        cells.push(null)
        continue
      }
      if (!isRecord(cell)) return err("table_fill: celulă invalidă.")
      if (cell.blank === true) {
        const answer = (asString(cell.answer) || "").trim()
        if (!answer) return err("table_fill: celulele blank necesită answer pentru validare.")
        cells.push({ blank: true, answer })
      } else {
        const text = asString(cell.text) ?? ""
        cells.push({ text })
      }
    }
    rows.push({ cells })
  }
  return ok({ instructions, headers, rows })
}

function parseMemory(c: Record<string, unknown>): Res<MemoryFlipContent> {
  const instructions = asString(c.instructions) ?? undefined
  const pr = c.pairs
  if (!Array.isArray(pr) || pr.length < 1) return err("memory_flip: pairs nevid.")
  const pairs: { a: string; b: string }[] = []
  for (const p of pr) {
    if (!isRecord(p)) return err("memory_flip: pereche invalidă.")
    const a = (asString(p.a) || "").trim()
    const b = (asString(p.b) || "").trim()
    if (!a || !b) return err("memory_flip: fiecare pereche are nevoie de a și b (LaTeX/markdown).")
    pairs.push({ a, b })
  }
  return ok({ instructions, pairs })
}

function parseSpeed(c: Record<string, unknown>): Res<SpeedRoundContent> {
  const secondsTotal = asInt(c.secondsTotal, 60)
  if (secondsTotal < 10 || secondsTotal > 600) return err("speed_round: secondsTotal între 10 și 600.")
  const qs = c.questions
  if (!Array.isArray(qs) || qs.length < 1) return err("speed_round: questions nevid.")
  const questions: SpeedRoundContent["questions"] = []
  for (const q of qs) {
    if (!isRecord(q)) return err("speed_round: întrebare invalidă.")
    const prompt = (asString(q.prompt) || "").trim()
    const opts = q.options
    if (!prompt || !Array.isArray(opts) || opts.length < 2) return err("speed_round: prompt și minim 2 opțiuni.")
    const options = opts.map((o) => (typeof o === "string" ? o : String(o)))
    const correctIndex = asInt(q.correctIndex, -1)
    if (correctIndex < 0 || correctIndex >= options.length) {
      return err("speed_round: correctIndex invalid.")
    }
    questions.push({ prompt, options, correctIndex })
  }
  return ok({ secondsTotal, questions })
}

function parseReveal(c: Record<string, unknown>): Res<RevealStepsContent> {
  const instructions = asString(c.instructions) ?? undefined
  const raw = c.steps
  if (!Array.isArray(raw) || raw.length < 1) return err("reveal_steps: steps nevid.")
  const steps: RevealStepBlock[] = []
  for (const b of raw) {
    if (!isRecord(b)) return err("reveal_steps: pas invalid.")
    const kind = asString(b.kind)
    if (kind === "markdown") {
      const content = (asString(b.content) || "").trim()
      if (!content) return err("reveal_steps: markdown gol.")
      steps.push({ kind: "markdown", content })
    } else if (kind === "quiz") {
      const content = asString(b.content) ?? undefined
      const opts = b.options
      if (!Array.isArray(opts) || opts.length < 2) return err("reveal_steps: quiz cu minim 2 opțiuni.")
      const options = opts.map((o) => (typeof o === "string" ? o : String(o)))
      const correctIndex = asInt(b.correctIndex, -1)
      if (correctIndex < 0 || correctIndex >= options.length) return err("reveal_steps: correctIndex invalid.")
      steps.push({ kind: "quiz", content, options, correctIndex })
    } else {
      return err("reveal_steps: kind trebuie markdown sau quiz.")
    }
  }
  return ok({ instructions, steps })
}

export function parseInteractiveItemContent(
  itemType: LearningPathInteractiveItemType,
  raw: unknown
): Res<ParsedInteractiveContent> {
  if (!isRecord(raw)) return err("content_json trebuie să fie un obiect.")
  switch (itemType) {
    case "card_sort": {
      const r = parseCardSort(raw)
      return r.ok ? ok({ itemType: "card_sort", data: r.value }) : r
    }
    case "fill_slot": {
      const r = parseFillSlot(raw)
      return r.ok ? ok({ itemType: "fill_slot", data: r.value }) : r
    }
    case "match": {
      const r = parseMatch(raw)
      return r.ok ? ok({ itemType: "match", data: r.value }) : r
    }
    case "graph_build": {
      const r = parseGraphBuild(raw)
      return r.ok ? ok({ itemType: "graph_build", data: r.value }) : r
    }
    case "code_trace": {
      const r = parseCodeTrace(raw)
      return r.ok ? ok({ itemType: "code_trace", data: r.value }) : r
    }
    case "swipe_classify": {
      const r = parseSwipe(raw)
      return r.ok ? ok({ itemType: "swipe_classify", data: r.value }) : r
    }
    case "flow_build": {
      const r = parseFlow(raw)
      return r.ok ? ok({ itemType: "flow_build", data: r.value }) : r
    }
    case "slider_explore": {
      const r = parseSlider(raw)
      return r.ok ? ok({ itemType: "slider_explore", data: r.value }) : r
    }
    case "table_fill": {
      const r = parseTable(raw)
      return r.ok ? ok({ itemType: "table_fill", data: r.value }) : r
    }
    case "memory_flip": {
      const r = parseMemory(raw)
      return r.ok ? ok({ itemType: "memory_flip", data: r.value }) : r
    }
    case "speed_round": {
      const r = parseSpeed(raw)
      return r.ok ? ok({ itemType: "speed_round", data: r.value }) : r
    }
    case "reveal_steps": {
      const r = parseReveal(raw)
      return r.ok ? ok({ itemType: "reveal_steps", data: r.value }) : r
    }
    default:
      return err("Tip interactiv necunoscut.")
  }
}

export function validateInteractiveItemContent(itemType: string, raw: unknown): string | null {
  if (!isInteractiveLessonItemType(itemType)) return null
  const res = parseInteractiveItemContent(itemType, raw)
  return res.ok ? null : res.error
}

export function getDefaultInteractiveItemContent(itemType: LearningPathInteractiveItemType): Record<string, unknown> {
  switch (itemType) {
    case "card_sort":
      return {
        instructions: "Aranjează pașii algoritmului în ordinea corectă.",
        cards: [
          { id: "a", text: "Inițializare" },
          { id: "b", text: "Iterație" },
          { id: "c", text: "Verificare condiție" },
          { id: "d", text: "Final" },
        ],
        correctOrder: ["a", "c", "b", "d"],
      }
    case "fill_slot":
      return {
        instructions: "Completează spațiile goale trăgând chip-uri sau apăsând pe ele.",
        latexTemplate: "F = {{m}} \\cdot a",
        slots: [{ id: "m", answer: "2" }],
        chips: ["1", "2", "5", "10"],
      }
    case "match":
      return {
        instructions: "Asociază fiecare termen din stânga cu definiția corectă din dreapta.",
        left: [
          { id: "l1", text: "Viteză" },
          { id: "l2", text: "Accelerație" },
        ],
        right: [
          { id: "r1", text: "$m/s$" },
          { id: "r2", text: "$m/s^2$" },
        ],
        pairs: [
          { leftId: "l1", rightId: "r1" },
          { leftId: "l2", rightId: "r2" },
        ],
      }
    case "graph_build":
      return {
        mode: "pick_curve",
        prompt: "Care curbă descrie corect viteza unui corp lăsat să cadă (fără rezistență)?",
        correctOptionId: "b",
        options: [
          { id: "a", label: "Constant", svgPath: "M 5 30 L 95 30" },
          { id: "b", label: "Liniar în creștere", svgPath: "M 5 35 L 95 5" },
          { id: "c", label: "Descrescător", svgPath: "M 5 5 L 95 35" },
        ],
      }
    case "code_trace":
      return {
        language: "python",
        lines: ["x = 1", "y = x + 2", "x = y * 2", "print(x)"],
        steps: [
          {
            lineIndex: 1,
            prompt: "Care este valoarea lui **y** după executarea liniei evidențiate?",
            inputMode: "choice",
            options: ["2", "3", "4"],
            answer: "3",
          },
          {
            lineIndex: 2,
            prompt: "Care este valoarea lui **x** după această linie?",
            inputMode: "text",
            answer: "6",
          },
        ],
      }
    case "swipe_classify":
      return {
        prompt: "Clasifică rapid fiecare afirmație.",
        leftLabel: "Adevărat",
        rightLabel: "Fals",
        cards: [
          { text: "Lumina are întotdeauna aceeași viteză în vid.", side: "left" },
          { text: "Masa relativistă scade când viteza crește.", side: "right" },
        ],
      }
    case "flow_build":
      return {
        instructions: "Selectează două noduri pe rând pentru a crea o muchie orientată. Construiește fluxul corect.",
        nodes: [
          { id: "s", kind: "start", label: "Start" },
          { id: "p", kind: "process", label: "Citire n" },
          { id: "e", kind: "end", label: "Stop" },
        ],
        correctEdges: [
          { from: "s", to: "p" },
          { from: "p", to: "e" },
        ],
      }
    case "slider_explore":
      return {
        instructions: "Mișcă cursorul pentru **m** până când rezultatul intră în intervalul țintă (verde).",
        sliders: [{ id: "m", label: "m (kg)", min: 0.5, max: 20, step: 0.1, default: 2 }],
        formula: "m * 5",
        targetMin: 49,
        targetMax: 51,
      }
    case "table_fill":
      return {
        instructions: "Completează celulele goale.",
        headers: ["Mărime", "Unitate SI"],
        rows: [
          { cells: [{ text: "Forță" }, { blank: true, answer: "N" }] },
          { cells: [{ text: "Energie" }, { blank: true, answer: "J" }] },
        ],
      }
    case "memory_flip":
      return {
        instructions: "Găsește perechile potrivite.",
        pairs: [
          { a: "$\\vec{F}$", b: "Forță" },
          { a: "$W$", b: "Lucru mecanic" },
        ],
      }
    case "speed_round":
      return {
        secondsTotal: 60,
        questions: [
          {
            prompt: "Complexitatea căutării binare într-un tablou sortat?",
            options: ["O(n)", "O(log n)", "O(n^2)"],
            correctIndex: 1,
          },
        ],
      }
    case "reveal_steps":
      return {
        instructions: "Parcurge demonstrația pas cu pas.",
        steps: [
          { kind: "markdown", content: "Fie $f$ continuă pe $[a,b]$." },
          {
            kind: "quiz",
            content: "Ce teoremă folosim pentru a garanta existența unei primitive?",
            options: ["Weierstrass", "Bolzano", "Din analiza matematică — TC pentru integrale"],
            correctIndex: 2,
          },
          { kind: "markdown", content: "Continuăm cu pasul următor..." },
        ],
      }
    default:
      return {}
  }
}

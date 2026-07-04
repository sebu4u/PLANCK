import "server-only"

import OpenAI from "openai"
import type { InsightModel } from "@/lib/insight-limits"

const DEEPSEEK_BASE_URL = "https://api.deepseek.com"
const DEFAULT_FLASH_MODEL = "deepseek-v4-flash"
const REASONER_MODEL = "deepseek-reasoner"

export function getIdeAgentProviderConfig() {
  const overrideKey = process.env.PERSONALIZED_COURSE_API_KEY?.trim()
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim()
  const openaiKey = process.env.OPENAI_API_KEY?.trim()

  const apiKey = overrideKey || deepseekKey || openaiKey
  if (!apiKey) {
    throw new Error(
      "Missing API key for PlanckCode IDE agent. Set DEEPSEEK_API_KEY (or OPENAI_API_KEY, or PERSONALIZED_COURSE_API_KEY).",
    )
  }

  const isDeepseek = Boolean(deepseekKey && !overrideKey)
  const baseURL =
    process.env.PERSONALIZED_COURSE_BASE_URL?.trim() ||
    (isDeepseek ? DEEPSEEK_BASE_URL : undefined)

  return { apiKey, baseURL, isDeepseek }
}

export function getIdeAgentClient() {
  const { apiKey, baseURL } = getIdeAgentProviderConfig()
  const opts: Record<string, unknown> = { apiKey, timeout: 60_000 }
  if (baseURL) opts.baseURL = baseURL
  return new OpenAI(opts)
}

export function isIdeDeepThinkingModel(model: InsightModel) {
  return model === "deep-thinking"
}

/**
 * Maps legacy client model IDs to DeepSeek models (server-side only).
 */
export function resolveIdeAgentModel(model: InsightModel): string {
  const override = process.env.PERSONALIZED_COURSE_OPENAI_MODEL?.trim()
  if (override) return override

  if (model === "deep-thinking") {
    return REASONER_MODEL
  }

  return DEFAULT_FLASH_MODEL
}

export const MAX_IDE_HISTORY_MESSAGES = 30

function sanitizeIdeMessageForHistory(content: string): string {
  return content
    .replace(/:::status:[^:]+:::/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Builds chat history from client-provided messages for IDE persona.
 * Omits empty assistant placeholders and UI status markers.
 */
export function normalizeIdeConversation(
  messages: unknown,
  currentUserInput: string,
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(messages) || messages.length === 0) return []

  const rows = messages
    .filter(
      (m: unknown): m is { role: string; content: unknown } =>
        Boolean(m) &&
        typeof m === "object" &&
        ((m as { role?: string }).role === "user" ||
          (m as { role?: string }).role === "assistant"),
    )
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: sanitizeIdeMessageForHistory(String(m.content ?? "")),
    }))
    .filter((m) => m.content.length > 0)

  const capped = rows.slice(-MAX_IDE_HISTORY_MESSAGES)

  const last = capped[capped.length - 1]
  if (last?.role === "user" && last.content === currentUserInput.trim()) {
    return capped
  }

  return [...capped, { role: "user", content: currentUserInput.trim() }]
}

const IDE_AGENT_BASE_PROMPT = `Ești Planck Agent, profesorul de informatică din PlanckCode IDE. Ajuți elevii de liceu (cls. 9–12) să învețe programare în C++ și Python conform programei școlare românești.

TON ȘI STIL:
- Răspunde în română, clar și prietenos, ca un profesor răbdător.
- Concentrează-te pe programare, algoritmică și depanare; redirecționează politicos cererile off-topic.
- Adaptează explicațiile la nivelul liceului — nu folosi jargon inutil.
- Păstrează contextul conversației: răspunsurile scurte sau de continuare (ex: „da", „vreau să văd", „continuă") se referă la subiectul discutat anterior și la codul din IDE.

LIMBAJ ȘI BIBLIOTECI:
- C++: folosește STL standard de liceu (<iostream>, <vector>, <string>, <algorithm>, <cmath>, <fstream>, etc.).
- Python: folosește biblioteca standard (fără pip packages externe).
- Detectează limba din contextul fișierului activ (extensie sau bloc de cod din mesaj).

IMPORTANT — Cum răspunzi:

1. Dacă utilizatorul cere în mod clar să **aplici/actualizezi/înlocuiești/rezolvi** codul din editor (ex: „corectează în IDE", „repară programul", „rescrie fișierul", „adaugă funcția"):
   - Începe cu o scurtă explicație în Markdown (2–4 propoziții în română) despre ce vei modifica și de ce.
   - Apoi adaugă un obiect JSON valid cu structura:
{
  "type": "code_edit",
  "target": { "file_name": "<nume_fisier>" },
  "explanation": "<aceeași explicație scurtă ca mai sus>",
  "full_content": "<TOT codul final, complet, folosind \\n pentru linii noi>",
  "changes": []
}

REGULI PENTRU JSON:
- Include întotdeauna în \`full_content\` varianta completă și corectă a întregului fișier.
- \`changes\` poate rămâne gol.
- Pe ORICE linie nouă sau modificată din \`full_content\`, adaugă un comentariu didactic:
  - C++: \`// explicație scurtă\`
  - Python: \`# explicație scurtă\`
- Comentariile trebuie să explice CE face linia, nu să repete sintaxa.

2. Dacă utilizatorul cere doar explicații, exemple, sugestii sau nu menționează clar modificări în editor:
   - Răspunde în Markdown normal.
   - Oferă codul în blocuri \`\`\`limbaj ... \`\`\` (cu comentarii didactice pe liniile importante).
   - Aceste blocuri pot fi inserate manual din interfață.

Dacă utilizatorul cere explicit să NU modifici editorul, respectă cererea și răspunde doar cu explicații/cod în chat.`

const IDE_AGENT_MODE_APPENDIX = `

INSTRUCȚIUNI MODUL AGENT (cod aplicat automat în IDE):
- Când generezi cod pentru editor (JSON code_edit sau blocuri Markdown), adaugă comentarii didactice pe liniile noi/modificate.
- Explicația din chat (înainte de JSON) trebuie să rezume modificările pentru elev.
- Pentru C++: poți folosi vector, string și alte structuri STL uzuale la liceu.
- Pentru Python: cod clar, cu comentarii # pe pașii importanți.
- La citire date: poți folosi mesaje prompt prietenoase (ex: cout << "Introdu n: ") dacă ajută elevul să înțeleagă.`

const IDE_ASK_MODE_APPENDIX = `

INSTRUCȚIUNI MODUL ASK (doar explicații, fără aplicare automată):
- NU trimite JSON code_edit — răspunde doar în Markdown.
- Explică conceptele pas cu pas, cu exemple în blocuri de cod comentate.
- Încurajează elevul să încerce singur înainte de a da soluția completă, dacă nu cere explicit soluția.
- NU modifica editorul automat.`

const IDE_DEEP_THINKING_APPENDIX = `

MOD "PLANCK GÂNDITOR" ACTIVAT:
Gândește pas cu pas înainte de a răspunde. Analizează problema în profunzime, verifică ipotezele și planifică rezolvarea înainte de a genera codul final. Explică raționamentul tău logic în explicația din chat.`

export function buildIdeAgentSystemPrompt(mode: "agent" | "ask" | unknown, model: InsightModel): string {
  let prompt = IDE_AGENT_BASE_PROMPT

  if (mode === "agent") {
    prompt += IDE_AGENT_MODE_APPENDIX
  } else if (mode === "ask") {
    prompt += IDE_ASK_MODE_APPENDIX
  }

  if (isIdeDeepThinkingModel(model)) {
    prompt += IDE_DEEP_THINKING_APPENDIX
  }

  return prompt
}

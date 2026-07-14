import type { CodingProblem } from "@/components/coding-problems/types"

export type InformaticsTestRow = {
  stdin: string
  expected_stdout: string
  is_sample: boolean
  weight: number
}

export type InformaticsContentDraft = {
  statement_markdown: string
  requirement_markdown: string
  input_format: string
  output_format: string
  constraints_markdown: string
  sample_input: string
  sample_output: string
  hint_1_markdown: string
  hint_2_markdown: string
  solution_markdown: string
  boilerplate_cpp: string
  boilerplate_python: string
  tests: InformaticsTestRow[]
}

export function initialInformaticsTestRow(isSample = false): InformaticsTestRow {
  return { stdin: "", expected_stdout: "", is_sample: isSample, weight: 1 }
}

export function problemToContentDraft(
  problem: CodingProblem | Record<string, unknown>,
  tests: Array<Record<string, unknown>> = []
): InformaticsContentDraft {
  const p = problem as Record<string, unknown>
  return {
    statement_markdown: typeof p.statement_markdown === "string" ? p.statement_markdown : "",
    requirement_markdown: typeof p.requirement_markdown === "string" ? p.requirement_markdown : "",
    input_format: typeof p.input_format === "string" ? p.input_format : "",
    output_format: typeof p.output_format === "string" ? p.output_format : "",
    constraints_markdown: typeof p.constraints_markdown === "string" ? p.constraints_markdown : "",
    sample_input: typeof p.sample_input === "string" ? p.sample_input : "",
    sample_output: typeof p.sample_output === "string" ? p.sample_output : "",
    hint_1_markdown: typeof p.hint_1_markdown === "string" ? p.hint_1_markdown : "",
    hint_2_markdown: typeof p.hint_2_markdown === "string" ? p.hint_2_markdown : "",
    solution_markdown: typeof p.solution_markdown === "string" ? p.solution_markdown : "",
    boilerplate_cpp: typeof p.boilerplate_cpp === "string" ? p.boilerplate_cpp : "",
    boilerplate_python: typeof p.boilerplate_python === "string" ? p.boilerplate_python : "",
    tests:
      tests.length > 0
        ? tests.map((t) => ({
            stdin: typeof t.stdin === "string" ? t.stdin : "",
            expected_stdout: typeof t.expected_stdout === "string" ? t.expected_stdout : "",
            is_sample: t.is_sample === true,
            weight: typeof t.weight === "number" ? t.weight : Number.parseFloat(String(t.weight)) || 1,
          }))
        : [initialInformaticsTestRow(true)],
  }
}

export type InformaticsPatchMetadata = {
  is_active?: boolean
  explanation_markdown?: string
}

export function buildPatchPayloadFromDraft(
  problem: CodingProblem,
  draft: InformaticsContentDraft,
  metadata: InformaticsPatchMetadata = {}
): Record<string, unknown> {
  const tags = Array.isArray(problem.tags) ? problem.tags : []
  return {
    slug: problem.slug,
    title: problem.title,
    statement_markdown: draft.statement_markdown.trim(),
    requirement_markdown: draft.requirement_markdown.trim(),
    input_format: draft.input_format,
    output_format: draft.output_format,
    constraints_markdown: draft.constraints_markdown.trim(),
    difficulty: problem.difficulty,
    class: problem.class,
    chapter: problem.chapter?.trim() || "Capitol neclasificat",
    language: problem.language === "cpp" ? "cpp" : "python",
    time_limit_ms: problem.time_limit_ms,
    memory_limit_kb: problem.memory_limit_kb,
    points: problem.points,
    is_active: metadata.is_active !== false,
    tags,
    sample_input: draft.sample_input,
    sample_output: draft.sample_output,
    hint_1_markdown: draft.hint_1_markdown.trim(),
    hint_2_markdown: draft.hint_2_markdown.trim(),
    solution_markdown: draft.solution_markdown.trim(),
    explanation_markdown:
      metadata.explanation_markdown?.trim() ?? problem.explanation_markdown?.trim() ?? "",
    boilerplate_cpp: draft.boilerplate_cpp,
    boilerplate_python: draft.boilerplate_python,
    tests: draft.tests.map((t) => ({
      stdin: t.stdin,
      expected_stdout: t.expected_stdout,
      is_sample: t.is_sample,
      weight: t.weight,
    })),
  }
}

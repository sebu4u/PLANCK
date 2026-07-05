import { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"

function appendSection(sections: string[], label: string, content: string | null | undefined) {
  if (!content?.trim()) return
  sections.push(`\n## ${label}\n${content.trim()}`)
}

export function buildCodingProblemAgentContext(
  problem: CodingProblem,
  examples: CodingProblemExample[],
): string {
  const sections: string[] = [
    `# Problema: ${problem.title}`,
    `Slug: ${problem.slug}`,
    `Limbaj oficial: ${problem.language === "python" ? "Python" : "C++"}`,
    `Dificultate: ${problem.difficulty}`,
    `Clasă: a ${problem.class}-a`,
    `Capitol: ${problem.chapter}`,
    `Puncte: ${problem.points}`,
    `Limită timp: ${problem.time_limit_ms} ms`,
    `Limită memorie: ${problem.memory_limit_kb} KB`,
  ]

  if (problem.tags?.length) {
    sections.push(`Tag-uri: ${problem.tags.join(", ")}`)
  }

  appendSection(sections, "Enunț", problem.statement_markdown)
  appendSection(sections, "Cerință", problem.requirement_markdown)
  appendSection(sections, "Date de intrare", problem.input_format)
  appendSection(sections, "Date de ieșire", problem.output_format)
  appendSection(sections, "Restricții", problem.constraints_markdown)
  appendSection(sections, "Explicație exemplu", problem.explanation_markdown)

  if (problem.sample_input?.trim() || problem.sample_output?.trim()) {
    sections.push("\n## Exemplu din enunț")
    if (problem.sample_input?.trim()) {
      sections.push(`**Intrare:**\n\`\`\`\n${problem.sample_input.trim()}\n\`\`\``)
    }
    if (problem.sample_output?.trim()) {
      sections.push(`**Ieșire:**\n\`\`\`\n${problem.sample_output.trim()}\n\`\`\``)
    }
  }

  if (examples.length > 0) {
    sections.push("\n## Exemple test")
    examples.forEach((example, index) => {
      sections.push(`\n### Exemplu ${index + 1}`)
      if (example.sample_input?.trim()) {
        sections.push(`**Intrare:**\n\`\`\`\n${example.sample_input.trim()}\n\`\`\``)
      }
      if (example.sample_output?.trim()) {
        sections.push(`**Ieșire:**\n\`\`\`\n${example.sample_output.trim()}\n\`\`\``)
      }
      if (example.explanation?.trim()) {
        sections.push(`**Explicație:** ${example.explanation.trim()}`)
      }
    })
  }

  return sections.join("\n")
}

export function buildCodingProblemContextMessage(
  problem: CodingProblem,
  examples: CodingProblemExample[],
): { role: "user"; content: string } {
  return {
    role: "user",
    content: [
      "Context: datele complete ale problemei de informatică la care lucrează elevul.",
      "Folosește aceste informații pentru a răspunde la întrebări, a explica algoritmul și a genera cod corect în editor.",
      "NU recomanda alte probleme sau resurse externe — concentrează-te pe această problemă.",
      "",
      buildCodingProblemAgentContext(problem, examples),
    ].join("\n"),
  }
}

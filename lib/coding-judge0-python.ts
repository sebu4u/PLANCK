/** Judge0 language id (Python 3.8.1) — public CE; override via env if needed */
export const JUDGE0_PYTHON_LANGUAGE_ID = Number(process.env.JUDGE0_PYTHON_LANGUAGE_ID ?? 71)

const JUDGE0_URLS = [
  "https://ce.judge0.com/submissions?base64_encoded=true&wait=true",
  "https://api.judge0.com/submissions?base64_encoded=true&wait=true",
] as const

export interface Judge0Result {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: { id: number; description: string }
  time: string | null
  memory: number | null
}

export function normalizeJudgeStdout(s: string | null | undefined): string {
  if (s == null) return ""
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd()
}

function decodeBase64(str: string | null): string | null {
  if (!str) return null
  try {
    return Buffer.from(str, "base64").toString("utf-8")
  } catch {
    return null
  }
}

export async function runJudge0PythonSubmission(input: {
  sourceCode: string
  stdin: string
  cpuTimeSeconds: number
  memoryLimitKb: number
}): Promise<Judge0Result> {
  const body: Record<string, unknown> = {
    source_code: Buffer.from(input.sourceCode).toString("base64"),
    language_id: JUDGE0_PYTHON_LANGUAGE_ID,
    stdin: Buffer.from(input.stdin ?? "").toString("base64"),
    cpu_time_limit: String(Math.max(1, Math.ceil(input.cpuTimeSeconds))),
    memory_limit: Math.max(2048, Math.floor(input.memoryLimitKb)),
  }

  let lastError: string | null = null
  for (const url of JUDGE0_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        lastError = await response.text()
        continue
      }
      const raw = (await response.json()) as {
        stdout: string | null
        stderr: string | null
        compile_output: string | null
        status?: { id: number; description: string }
        time?: string | null
        memory?: number | null
      }
      return {
        stdout: decodeBase64(raw.stdout),
        stderr: decodeBase64(raw.stderr),
        compile_output: decodeBase64(raw.compile_output),
        status: raw.status ?? { id: 0, description: "Unknown" },
        time: raw.time ?? null,
        memory: raw.memory ?? null,
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "fetch failed"
    }
  }
  throw new Error(lastError || "Judge0 unavailable")
}

export function judgeOutputMatches(expected: string, actual: string | null | undefined): boolean {
  return normalizeJudgeStdout(expected) === normalizeJudgeStdout(actual ?? "")
}

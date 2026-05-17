import type { FileItem } from "@/lib/types"

/** Trebuie să coincidă cu URL-ul CDN (vezi pyodide.js de pe jsdelivr). */
export const PLANCK_PYODIDE_VERSION = "0.26.4"

const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PLANCK_PYODIDE_VERSION}/full/`
const PYODIDE_SCRIPT_URL = `${INDEX_URL}pyodide.js`

export interface PlanckPythonRunInput {
  files: { name: string; content: string }[]
  /** Active Python file name (e.g. main.py) under /planck */
  entryFileName: string
  stdinText: string
}

export interface PlanckPythonRunResult {
  stdout: string
  stderr: string
  exitCode: number
  /** Relative paths under project root → new content (changed or new files). */
  fileUpdates: Record<string, string>
}

/** Suprafață minimă folosită de Planck (fără import din pachetul npm — compatibil Turbopack). */
export type PlanckPyodideInstance = {
  globals: {
    get(name: string): unknown
    set(name: string, value: unknown): void
  }
  runPythonAsync(code: string): Promise<void>
  FS: EmscriptenFS
}

type EmscriptenFS = {
  mkdir(path: string): void
  readdir(path: string): string[]
  stat(path: string): { mode: number }
  isDir(mode: number): boolean
  unlink(path: string): void
  rmdir(path: string): void
  writeFile(path: string, data: string | Uint8Array): void
  readFile(path: string, opts: { encoding: "utf8" }): string
}

type LoadPyodideFn = (options?: {
  indexURL?: string
  fullStdLib?: boolean
}) => Promise<PlanckPyodideInstance>

function getLoadPyodideFromWindow(): LoadPyodideFn | undefined {
  if (typeof window === "undefined") return undefined
  const g = globalThis as unknown as { loadPyodide?: LoadPyodideFn }
  return typeof g.loadPyodide === "function" ? g.loadPyodide : undefined
}

const PYODIDE_SCRIPT_ID = "planck-pyodide-cdn-script"

function injectPyodideScript(): Promise<void> {
  const existing = document.getElementById(PYODIDE_SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve, reject) => {
      if (getLoadPyodideFromWindow()) {
        resolve()
        return
      }
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Pyodide script failed to load")), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement("script")
    s.id = PYODIDE_SCRIPT_ID
    s.src = PYODIDE_SCRIPT_URL
    s.async = true
    s.crossOrigin = "anonymous"
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Nu s-a putut încărca Pyodide de la ${PYODIDE_SCRIPT_URL}`))
    document.head.appendChild(s)
  })
}

function getFS(py: PlanckPyodideInstance): EmscriptenFS {
  return (py as unknown as { FS: EmscriptenFS }).FS
}

function rmRecursive(FS: EmscriptenFS, path: string): void {
  let st: { mode: number }
  try {
    st = FS.stat(path)
  } catch {
    return
  }
  if (!FS.isDir(st.mode)) {
    FS.unlink(path)
    return
  }
  for (const name of FS.readdir(path)) {
    if (name === "." || name === "..") continue
    rmRecursive(FS, `${path}/${name}`)
  }
  FS.rmdir(path)
}

function collectPlanckFiles(FS: EmscriptenFS, root: string): Record<string, string> {
  const out: Record<string, string> = {}

  const walk = (dir: string, relPrefix: string) => {
    for (const name of FS.readdir(dir)) {
      if (name === "." || name === "..") continue
      if (name === "__pycache__") continue
      const full = `${dir}/${name}`
      const st = FS.stat(full)
      if (FS.isDir(st.mode)) {
        walk(full, relPrefix ? `${relPrefix}/${name}` : name)
      } else {
        if (name.endsWith(".pyc")) continue
        const rel = relPrefix ? `${relPrefix}/${name}` : name
        try {
          const content = FS.readFile(full, { encoding: "utf8" })
          out[rel] = content
        } catch {
          /* skip binary */
        }
      }
    }
  }

  try {
    walk(root, "")
  } catch {
    /* missing root */
  }
  return out
}

function pyGlobalToString(py: PlanckPyodideInstance, key: string): string {
  const v = py.globals.get(key) as unknown
  if (v == null) return ""
  if (typeof v === "string") return v
  if (typeof (v as { toString?: () => string }).toString === "function") {
    return (v as { toString: () => string }).toString()
  }
  return String(v)
}

let pyodideSingleton: PlanckPyodideInstance | null = null
let pyodideLoading: Promise<PlanckPyodideInstance> | null = null

export function loadPlanckPyodide(): Promise<PlanckPyodideInstance> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide runs only in the browser."))
  }
  if (pyodideSingleton) return Promise.resolve(pyodideSingleton)
  if (pyodideLoading) return pyodideLoading

  pyodideLoading = (async () => {
    await injectPyodideScript()
    const loadPyodide = getLoadPyodideFromWindow()
    if (!loadPyodide) {
      throw new Error("loadPyodide nu este disponibil după încărcarea scriptului.")
    }
    pyodideSingleton = await loadPyodide({
      indexURL: INDEX_URL,
      fullStdLib: true,
    })
    pyodideLoading = null
    return pyodideSingleton
  })()

  return pyodideLoading
}

const PLANCK_ROOT = "/planck"

export async function runPythonProject(input: PlanckPythonRunInput): Promise<PlanckPythonRunResult> {
  const py = await loadPlanckPyodide()
  const FS = getFS(py)

  try {
    rmRecursive(FS, PLANCK_ROOT)
  } catch {
    /* ignore */
  }
  try {
    FS.mkdir(PLANCK_ROOT)
  } catch {
    /* exists */
  }

  const written = new Map(input.files.map((f) => [f.name, f.content]))
  for (const f of input.files) {
    FS.writeFile(`${PLANCK_ROOT}/${f.name}`, f.content)
  }

  if (!written.has(input.entryFileName)) {
    return {
      stdout: "",
      stderr: `Fișierul de intrare lipsește: ${input.entryFileName}`,
      exitCode: 1,
      fileUpdates: {},
    }
  }

  py.globals.set("__planck_stdin", input.stdinText ?? "")
  py.globals.set("__planck_entry", `${PLANCK_ROOT}/${input.entryFileName}`)

  const harness = `
import io, sys, os, traceback, runpy

_stdin_val = globals().get("__planck_stdin") or ""
sys.stdin = io.StringIO(_stdin_val)
_os_out = io.StringIO()
_os_err = io.StringIO()
_old_out, _old_err = sys.stdout, sys.stderr
sys.stdout, sys.stderr = _os_out, _os_err
_exit = 0
try:
    os.chdir("/planck")
    runpy.run_path(globals()["__planck_entry"], run_name="__main__")
except SystemExit as e:
    if e.code is None:
        _exit = 0
    elif isinstance(e.code, int):
        _exit = e.code
    else:
        _exit = 1
except BaseException:
    _exit = 1
    _os_err.write(traceback.format_exc())
finally:
    sys.stdout, sys.stderr = _old_out, _old_err

globals()["_planck_stdout"] = _os_out.getvalue()
globals()["_planck_stderr"] = _os_err.getvalue()
globals()["_planck_exit"] = _exit
`

  await py.runPythonAsync(harness)

  const stdout = pyGlobalToString(py, "_planck_stdout")
  const stderr = pyGlobalToString(py, "_planck_stderr")
  const exitCode = Number(pyGlobalToString(py, "_planck_exit")) || 0

  const disk = collectPlanckFiles(FS, PLANCK_ROOT)
  const fileUpdates: Record<string, string> = {}
  for (const [rel, content] of Object.entries(disk)) {
    const prev = written.get(rel)
    if (prev === undefined || prev !== content) {
      fileUpdates[rel] = content
    }
  }

  return { stdout, stderr, exitCode, fileUpdates }
}

export function inferPlanckFileKind(fileName: string): "cpp" | "txt" | "python" {
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".py")) return "python"
  if (lower.endsWith(".cpp") || lower.endsWith(".h") || lower.endsWith(".hpp")) return "cpp"
  return "txt"
}

/** Apply disk changes from a Pyodide run back into the IDE file list. */
export function mergePlanckIdeFiles(prev: FileItem[], updates: Record<string, string>): FileItem[] {
  const next = [...prev]
  for (const [relPath, content] of Object.entries(updates)) {
    const idx = next.findIndex((f) => f.name === relPath)
    if (idx >= 0) {
      next[idx] = { ...next[idx], content }
    } else {
      next.push({
        id: `fs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${relPath.replace(/\W+/g, "-")}`,
        name: relPath,
        content,
        type: inferPlanckFileKind(relPath),
      })
    }
  }
  return next
}

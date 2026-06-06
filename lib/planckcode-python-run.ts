import type { FileItem } from "@/lib/types"

/** Trebuie să coincidă cu URL-ul CDN (vezi pyodide.js de pe jsdelivr). */
export const PLANCK_PYODIDE_VERSION = "0.26.4"

const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PLANCK_PYODIDE_VERSION}/full/`
const PYODIDE_SCRIPT_URL = `${INDEX_URL}pyodide.js`

export interface PlanckPythonRunInput {
  files: { name: string; content: string }[]
  /** Active Python file name (e.g. main.py) under /planck */
  entryFileName: string
  /**
   * Valori pentru modul buffered (stdin fix).
   * Ignorat când rularea este interactivă (terminal).
   */
  stdinText?: string
}

export interface PlanckPythonRunResult {
  stdout: string
  stderr: string
  exitCode: number
  /** Relative paths under project root → new content (changed or new files). */
  fileUpdates: Record<string, string>
}

/** Opțiuni pentru stream stdout/stderr și stdin interactiv (consola din IDE). */
export interface PlanckPythonStreamingOpts {
  onStdoutChunk?: (s: string) => void
  onStderrChunk?: (s: string) => void
  interactiveStdin?: PlanckInteractiveStdinPump | null
}

export interface PlanckInteractiveStdinPump {
  /** Apelată din Python prin pyodide.ffi.run_sync — o linie de text (newline se adaugă dacă lipsește). */
  waitLineJs(): Promise<string>

  submitLine(line: string): void

  /** Respinge așteptarea curentă (rulare anulată / început rulare nou). */
  cancel(reason?: Error): void
}

export function createPlanckInteractiveStdinPump(onAwaitStdin?: () => void): PlanckInteractiveStdinPump {
  let pending: {
    resolve: (s: string) => void
    reject: (e: Error) => void
  } | null = null

  function submitLine(line: string) {
    if (!pending) return
    const { resolve } = pending
    pending = null
    resolve(line)
  }

  function cancel(reason?: Error) {
    if (!pending) return
    const { reject } = pending
    pending = null
    reject(reason ?? new Error("Cancelled"))
  }

  async function waitLineJs(): Promise<string> {
    onAwaitStdin?.()
    return await new Promise<string>((resolve, reject) => {
      pending = { resolve, reject }
    })
  }

  return {
    waitLineJs,
    submitLine,
    cancel,
  }
}

/** Heuristic pentru cod care citește de la consolă (nu din textarea-ul „stdin”). */
export function planckPythonUsesConsoleInput(source: string): boolean {
  return /\binput\s*\(/.test(source) || /\bsys\.stdin\b/.test(source)
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

const PLANCK_PYTHON_HARNESS = `
import builtins, io, sys, os, traceback, runpy

os.environ.setdefault("PYTHONUNBUFFERED", "1")

try:
    from pyodide.ffi import run_sync
except ImportError:
    run_sync = None

def _planck_format_exception(exc):
    tb = exc.__traceback__
    cleaned = None
    cur = tb
    while cur is not None:
        if cur.tb_frame.f_code.co_filename.startswith("/planck/"):
            cleaned = cur
            break
        cur = cur.tb_next
    text = "".join(traceback.format_exception(type(exc), exc, cleaned))
    return text.replace('File "/planck/', 'File "')

_use_interactive = bool(globals().get("__planck_use_interactive_stdin"))
_JS_WAIT_STDIN = globals().get("__planck_wait_stdin_js")

_os_out = io.StringIO()
_os_err = io.StringIO()

# Fiecare print trimite imediat la consolă (comportament apropiat de -u), astfel încât
# liniile rulează vizibil pe rând până la următorul input().
_orig_print = builtins.print

def _planck_print(*args, **kwargs):
    if "flush" not in kwargs:
        kwargs["flush"] = True
    return _orig_print(*args, **kwargs)

builtins.print = _planck_print

class _BridgingTextOut(io.TextIOBase):
    encoding = "utf-8"
    errors = "replace"
    __slots__ = ("_buf", "_emit_key")

    def __init__(self, collector: io.StringIO, emit_key: str | None):
        super().__init__()
        self._buf = collector
        self._emit_key = emit_key

    def writable(self):
        return True

    def write(self, s):
        if not s:
            return 0
        t = str(s)
        self._buf.write(t)
        if self._emit_key:
            emitter = globals().get(self._emit_key)
            if emitter is not None:
                try:
                    emitter(t)
                except BaseException:
                    pass
        return len(t)

    def flush(self):
        return None


_old_out, _old_err, _old_stdin = sys.stdout, sys.stderr, sys.stdin
sys.stdout = _BridgingTextOut(_os_out, "__planck_stdout_emit_js")
sys.stderr = _BridgingTextOut(_os_err, "__planck_stderr_emit_js")

if _use_interactive:
    class _PlanckInteractiveStdin(io.TextIOBase):
        encoding = "utf-8"
        errors = "replace"

        def readable(self):
            return True

        def readline(self, size=-1):
            if size != -1:
                raise io.UnsupportedOperation("Planck stdin: readline(size) nesuportat")
            nl = chr(10)
            cr = chr(13)
            if run_sync is None:
                raise RuntimeError(
                    "Consola interactivă nu e disponibilă (lipsește pyodide.ffi.run_sync — încearcă un browser actual)."
                )
            if _JS_WAIT_STDIN is None:
                raise RuntimeError("Intrare lipsă pentru modul terminal.")
            future = _JS_WAIT_STDIN()
            raw = run_sync(future)
            if raw is None:
                s = ""
            else:
                s = str(raw)
                s = s.replace(cr + nl, nl).replace(cr, nl)
            if not s.endswith(nl):
                s += nl
            return s

        def read(self, size=-1):
            raise io.UnsupportedOperation(
                "Planck stdin.read() nesuportat — folosește input() sau readline()."
            )

    sys.stdin = _PlanckInteractiveStdin()
else:
    _seed = globals().get("__planck_stdin") or ""
    sys.stdin = io.StringIO(_seed)

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
except BaseException as e:
    _exit = 1
    _os_err.write(_planck_format_exception(e))
finally:
    sys.stdout, sys.stderr, sys.stdin = _old_out, _old_err, _old_stdin

globals()["_planck_stdout"] = _os_out.getvalue()
globals()["_planck_stderr"] = _os_err.getvalue()
globals()["_planck_exit"] = _exit
`

export async function runPythonProject(
  input: PlanckPythonRunInput,
  streaming?: PlanckPythonStreamingOpts | null,
): Promise<PlanckPythonRunResult> {
  const py = await loadPlanckPyodide()
  const FS = getFS(py)

  const pump = streaming?.interactiveStdin ?? null
  const interactiveStdin = Boolean(pump)

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

  py.globals.set("__planck_use_interactive_stdin", interactiveStdin)
  py.globals.set("__planck_stdin", input.stdinText ?? "")
  py.globals.set("__planck_entry", `${PLANCK_ROOT}/${input.entryFileName}`)

  if (streaming?.onStdoutChunk) {
    py.globals.set("__planck_stdout_emit_js", (chunk: string) => streaming.onStdoutChunk?.(chunk))
  } else {
    py.globals.set("__planck_stdout_emit_js", undefined)
  }
  if (streaming?.onStderrChunk) {
    py.globals.set("__planck_stderr_emit_js", (chunk: string) => streaming.onStderrChunk?.(chunk))
  } else {
    py.globals.set("__planck_stderr_emit_js", undefined)
  }

  if (pump) {
    py.globals.set("__planck_wait_stdin_js", () => pump.waitLineJs())
  } else {
    py.globals.set("__planck_wait_stdin_js", undefined)
  }

  try {
    await py.runPythonAsync(PLANCK_PYTHON_HARNESS)
  } finally {
    pump?.cancel()
  }

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

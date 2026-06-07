"use client"

import { useState, useEffect, useRef } from "react"
import { flushSync } from "react-dom"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Lazy load Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  ),
})
import { Loader2, Play, File, FileCode, ChevronDown, ChevronUp, SendHorizontal } from "lucide-react"
import axios from "axios"
import type { editor as MonacoEditor } from "monaco-editor"
import {
  getFontStack,
  PlanckCodeThemeId,
  usePlanckCodeSettings,
} from "@/components/planckcode-settings-provider"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import type { FileItem } from "@/lib/types"
import {
  mergePlanckIdeFiles,
  runPythonProject,
  createPlanckInteractiveStdinPump,
  getPlanckPythonStatus,
  planckPythonUsesConsoleInput,
  type PlanckInteractiveStdinPump,
} from "@/lib/planckcode-python-run"
import { supabase } from "@/lib/supabaseClient"
import type { CodingSubmitResponse } from "./types"
import { CodingSubmitResultOverlay } from "./coding-submit-result-overlay"
import { cn } from "@/lib/utils"

const defaultCppCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`

const defaultPythonCode = `print("Hello, Planck!")\n`

function createInitialFiles(
  defaultLanguage: "cpp" | "python",
  initialCode?: string
): FileItem[] {
  if (defaultLanguage === "python") {
    const body =
      initialCode && initialCode.trim().length > 0 ? initialCode : defaultPythonCode
    return [{ id: "1", name: "main.py", content: body, type: "python" }]
  }
  return [
    {
      id: "1",
      name: "main.cpp",
      content: initialCode || defaultCppCode,
      type: "cpp",
    },
  ]
}

function monacoLanguageForFile(file: FileItem): string {
  if (file.type === "cpp") return "cpp"
  if (file.type === "python") return "python"
  return "plaintext"
}

const MONACO_THEME_DEFINITIONS: Record<PlanckCodeThemeId, MonacoEditor.IStandaloneThemeData> = {
  "planck-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5B9273" },
      { token: "keyword", foreground: "5DE4C7", fontStyle: "bold" },
      { token: "string", foreground: "F9E2AF" },
      { token: "number", foreground: "80CBC4" },
      { token: "type", foreground: "7AA2F7" },
      { token: "function", foreground: "9CDCFE" },
    ],
    colors: {
      "editor.background": "#060B10",
      "editor.foreground": "#F8FBFB",
      "editorCursor.foreground": "#5DE4C7",
      "editorLineNumber.foreground": "#3A4A4F",
      "editorLineNumber.activeForeground": "#8FE3D6",
      "editor.selectionBackground": "#124C3A",
      "editor.inactiveSelectionBackground": "#0C2F23",
      "editor.lineHighlightBackground": "#0C1A22",
      "editorIndentGuide.background": "#142126",
      "editorIndentGuide.activeBackground": "#255043",
    },
    semanticHighlighting: true,
  },
  "planck-nebula": {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "756499", fontStyle: "italic" },
      { token: "keyword", foreground: "C19CFF", fontStyle: "bold" },
      { token: "string", foreground: "F7C1FF" },
      { token: "number", foreground: "9CDCFE" },
      { token: "type", foreground: "8BD5FF" },
      { token: "function", foreground: "FFD6FF" },
    ],
    colors: {
      "editor.background": "#120A1E",
      "editor.foreground": "#F8EAFF",
      "editorCursor.foreground": "#C19CFF",
      "editorLineNumber.foreground": "#3F2F57",
      "editorLineNumber.activeForeground": "#C19CFF",
      "editor.selectionBackground": "#2A1747",
      "editor.inactiveSelectionBackground": "#201239",
      "editor.lineHighlightBackground": "#1C1031",
      "editorIndentGuide.background": "#2A1C44",
      "editorIndentGuide.activeBackground": "#4E2D7D",
    },
    semanticHighlighting: true,
  },
  "planck-classic": {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "808080", fontStyle: "italic" },
      { token: "keyword", foreground: "569CD6" },
      { token: "string", foreground: "CE9178" },
      { token: "number", foreground: "B5CEA8" },
      { token: "type", foreground: "4EC9B0" },
      { token: "function", foreground: "DCDCAA" },
    ],
    colors: {
      "editor.background": "#1E1E1E",
      "editor.foreground": "#D4D4D4",
      "editorCursor.foreground": "#AEAFAD",
      "editorLineNumber.foreground": "#5A5A5A",
      "editorLineNumber.activeForeground": "#CCCCCC",
      "editor.selectionBackground": "#264F78",
      "editor.inactiveSelectionBackground": "#3A3D41",
      "editor.lineHighlightBackground": "#2A2A2A",
      "editorIndentGuide.background": "#404040",
      "editorIndentGuide.activeBackground": "#707070",
    },
    semanticHighlighting: true,
  },
}

const ensureMonacoThemes = (monaco: typeof import("monaco-editor")) => {
  const themeIds = Object.keys(MONACO_THEME_DEFINITIONS) as PlanckCodeThemeId[]
  themeIds.forEach((themeId) => {
    monaco.editor.defineTheme(themeId, MONACO_THEME_DEFINITIONS[themeId])
  })
}

interface RunResponse {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: {
    id: number
    description: string
  }
  time: string | null
  memory: number | null
}

export interface EmbeddedIDEProps {
  initialCode?: string
  /** Limbajul problemei — controlează fișierul implicit (main.cpp vs main.py). */
  defaultLanguage?: "cpp" | "python"
  /** Dacă e setat (slug), apare butonul „Trimite” pentru evaluare oficială Python. */
  problemSlug?: string | null
  /** Apelat după o trimitere acceptată (status `accepted`). */
  onAcceptedSubmit?: () => void
  /** După Continuă pe cardul de rezultat acceptat — navigare la itemul următor. */
  onAcceptedContinue?: () => Promise<void> | void
  /** Controlează doar cromatica/layout-ul exterior; logica editorului și terminalului rămâne aceeași. */
  presentation?: "default" | "learning-path"
}

export default function EmbeddedIDE({
  initialCode,
  defaultLanguage = "cpp",
  problemSlug = null,
  onAcceptedSubmit,
  onAcceptedContinue,
  presentation = "default",
}: EmbeddedIDEProps) {
  const { settings } = usePlanckCodeSettings()
  const editorFontFamily = getFontStack(settings.font)
  const [files, setFiles] = useState<FileItem[]>(() =>
    createInitialFiles(defaultLanguage, initialCode)
  )
  const [activeFileId, setActiveFileId] = useState<string>("1")
  const [output, setOutput] = useState<RunResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true)
  const [stdin, setStdin] = useState<string>("")
  const [pythonLiveStdout, setPythonLiveStdout] = useState<string | null>(null)
  const [pythonLiveStderr, setPythonLiveStderr] = useState<string | null>(null)
  const [waitingForPythonConsoleLine, setWaitingForPythonConsoleLine] = useState(false)
  const [pythonConsoleLineInput, setPythonConsoleLineInput] = useState("")
  const pythonStdinPumpRef = useRef<PlanckInteractiveStdinPump | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<CodingSubmitResponse | null>(null)
  const submitDismissedRef = useRef(false)

  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)

  const activeFile = files.find((f) => f.id === activeFileId) || files[0]
  const stdinSidebarVisible = activeFile?.type !== "python"

  const getModelUri = (file: FileItem) => {
    return monacoRef.current?.Uri.parse(`inmemory://model/${file.id}/${file.name}`)
  }

  const ensureModelForFile = (file: FileItem) => {
    if (!monacoRef.current) return null
    const monaco = monacoRef.current
    const uri = getModelUri(file)
    if (!uri) return null

    let model = monaco.editor.getModel(uri)

    if (!model) {
      model = monaco.editor.createModel(file.content, monacoLanguageForFile(file), uri)
    } else if (model.getValue() !== file.content) {
      model.setValue(file.content)
    }

    return model
  }

  const switchToFileModel = (file: FileItem | undefined | null) => {
    const editor = editorRef.current
    if (!file || !editor) return
    const model = ensureModelForFile(file)
    if (!model) return

    const currentModel = editor.getModel()
    if (!currentModel || currentModel.uri.toString() !== model.uri.toString()) {
      editor.setModel(model)
    }

    const language = monacoLanguageForFile(file)
    if (monacoRef.current && model.getLanguageId() !== language) {
      monacoRef.current.editor.setModelLanguage(model, language)
    }
  }

  useEffect(() => {
    if (!activeFile) return
    switchToFileModel(activeFile)
  }, [activeFileId, activeFile?.type])

  useEffect(() => {
    files.forEach((file) => {
      ensureModelForFile(file)
    })
  }, [files])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.updateOptions({
      fontFamily: editorFontFamily,
      fontSize: settings.fontSize,
    })
  }, [editorFontFamily, settings.fontSize])

  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return
    ensureMonacoThemes(monaco)
    monaco.editor.setTheme(settings.theme)
  }, [settings.theme])

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile) return
    const newValue = value ?? ""

    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === activeFileId ? { ...f, content: newValue } : f))
    )
  }

  const getPythonMainSource = (): string | null => {
    const main = files.find((f) => f.name === "main.py" && f.type === "python")
    if (main) return main.content
    const anyPy = files.find((f) => f.type === "python")
    return anyPy?.content ?? null
  }

  const handleOfficialSubmit = async () => {
    if (!problemSlug || defaultLanguage !== "python") return
    submitDismissedRef.current = false
    setIsTerminalOpen(true)
    setSubmitLoading(true)
    setSubmitError(null)
    setSubmitResult(null)

    const source = getPythonMainSource()
    if (!source || !source.trim()) {
      if (!submitDismissedRef.current) {
        setSubmitError("Nu există cod Python de trimis (main.py).")
      }
      setSubmitLoading(false)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      if (!submitDismissedRef.current) {
        setSubmitError("Trebuie să fii autentificat pentru a trimite soluția la evaluare.")
      }
      setSubmitLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/coding-problems/${encodeURIComponent(problemSlug)}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceCode: source }),
      })
      const payload = (await res.json().catch(() => ({}))) as CodingSubmitResponse & { error?: string }

      if (!res.ok) {
        if (!submitDismissedRef.current) {
          setSubmitError(payload.error || `Evaluare eșuată (HTTP ${res.status}).`)
        }
        setSubmitLoading(false)
        return
      }

      if (!submitDismissedRef.current) {
        setSubmitResult({
          submissionId: payload.submissionId,
          status: payload.status,
          scorePercent: payload.scorePercent,
          passedTests: payload.passedTests,
          totalTests: payload.totalTests,
          judge0PythonLanguageId: payload.judge0PythonLanguageId,
          tests: Array.isArray(payload.tests) ? payload.tests : [],
          elo: payload.elo ?? null,
          eloError: payload.eloError ?? null,
        })
        if (payload.status === "accepted") {
          onAcceptedSubmit?.()
        }
      }
    } catch (e) {
      if (!submitDismissedRef.current) {
        setSubmitError(e instanceof Error ? e.message : "Eroare la trimiterea soluției.")
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const submitPythonTerminalLine = () => {
    const pump = pythonStdinPumpRef.current
    if (!pump || !waitingForPythonConsoleLine) return

    const line = pythonConsoleLineInput
    pump.submitLine(line)
    flushSync(() => {
      setPythonLiveStdout((prev) => (prev ?? "") + line + "\n")
    })
    setPythonConsoleLineInput("")
    setWaitingForPythonConsoleLine(false)
  }

  const submitPythonTerminalEof = () => {
    const pump = pythonStdinPumpRef.current
    if (!pump || !waitingForPythonConsoleLine) return

    pump.submitEof()
    setPythonConsoleLineInput("")
    setWaitingForPythonConsoleLine(false)
  }

  const handleRunCode = async () => {
    if (!isTerminalOpen) {
      setIsTerminalOpen(true)
    }

    setLoading(true)
    setError(null)
    setOutput(null)

    if (!activeFile) {
      setLoading(false)
      return
    }

    if (activeFile.type === "txt") {
      setError("Fișierele text nu pot fi rulate. Deschide un fișier .cpp sau .py.")
      setLoading(false)
      return
    }

    if (activeFile.type === "python") {
      const wantsConsoleStdin = planckPythonUsesConsoleInput(activeFile.content)

      pythonStdinPumpRef.current?.cancel()

      setWaitingForPythonConsoleLine(false)
      setPythonConsoleLineInput("")

      const pump = wantsConsoleStdin
        ? createPlanckInteractiveStdinPump(() => {
          flushSync(() => {
            setWaitingForPythonConsoleLine(true)
          })
        })
        : null
      pythonStdinPumpRef.current = pump

      if (wantsConsoleStdin) {
        setPythonLiveStdout("")
        setPythonLiveStderr("")
      } else {
        setPythonLiveStdout(null)
        setPythonLiveStderr(null)
      }

      try {
        const result = await runPythonProject(
          {
            files: files.map((f) => ({ name: f.name, content: f.content })),
            entryFileName: activeFile.name,
            stdinText: stdin,
          },
          pump
            ? {
                interactiveStdin: pump,
                onStdoutChunk: (s) =>
                  flushSync(() => {
                    setPythonLiveStdout((p) => (p ?? "") + s)
                  }),
                onStderrChunk: (s) =>
                  flushSync(() => {
                    setPythonLiveStderr((p) => (p ?? "") + s)
                  }),
              }
            : undefined,
        )

        setOutput({
          stdout: result.stdout || null,
          stderr: result.stderr || null,
          compile_output: null,
          status: getPlanckPythonStatus(result.exitCode, result.errorName),
          time: null,
          memory: null,
        })
        if (Object.keys(result.fileUpdates).length > 0) {
          setFiles((prev) => mergePlanckIdeFiles(prev, result.fileUpdates))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eroare la rularea Python.")
      } finally {
        pump?.cancel()
        pythonStdinPumpRef.current = null
        setWaitingForPythonConsoleLine(false)
        setPythonLiveStdout(null)
        setPythonLiveStderr(null)
        setLoading(false)
      }
      return
    }

    try {
      const response = await axios.post<RunResponse>("/api/run", {
        files: files.map((f) => ({ name: f.name, content: f.content })),
        stdin: stdin || undefined,
      })
      setOutput(response.data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data
        let errorMessage = "Failed to run code"
        if (errorData) {
          if (typeof errorData === "string") {
            errorMessage = errorData
          } else if (typeof errorData === "object") {
            errorMessage = errorData.error || errorData.details || errorData.message || errorMessage
          }
        }
        setError(errorMessage)
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditorBeforeMount = (monacoInstance: typeof import("monaco-editor")) => {
    ensureMonacoThemes(monacoInstance)
  }

  const handleEditorMount = (
    editorInstance: import("monaco-editor").editor.IStandaloneCodeEditor,
    monacoInstance: typeof import("monaco-editor")
  ) => {
    editorRef.current = editorInstance
    monacoRef.current = monacoInstance

    ensureMonacoThemes(monacoInstance)
    monacoInstance.editor.setTheme(settings.theme)
    editorInstance.updateOptions({
      fontFamily: editorFontFamily,
      fontSize: settings.fontSize,
    })

    files.forEach((file) => ensureModelForFile(file))
    switchToFileModel(activeFile)
  }

  const runHint =
    activeFile?.type === "python"
      ? "Python rulează în browser (prima rulare poate descărca interpretorul)."
      : "Compiling and running your code..."
  const isLearningPathPresentation = presentation === "learning-path"

  const fileTabs = (
    <div
      className={cn(
        "flex items-center justify-between gap-1 overflow-x-auto border-b border-[#3b3b3b] bg-[#1e1e1e] px-4 py-2",
        isLearningPathPresentation && "border-white/10 bg-[#0f141c]",
      )}
    >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-sm cursor-pointer transition-colors ${
                activeFileId === file.id
                  ? "bg-[#1e1e1e] text-white border-t border-l border-r border-[#3b3b3b]"
                  : "bg-[#2d2d2d] text-gray-400 hover:text-white hover:bg-[#3d3d3d]"
              }`}
              onClick={() => setActiveFileId(file.id)}
            >
              {file.type === "python" ? (
                <FileCode className="w-4 h-4 text-amber-300/90" />
              ) : file.type === "cpp" ? (
                <FileCode className="w-4 h-4" />
              ) : (
                <File className="w-4 h-4" />
              )}
              <span>{file.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Button
            onClick={handleRunCode}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 h-8 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Code
              </>
            )}
          </Button>
          {problemSlug && defaultLanguage === "python" ? (
            <Button
              type="button"
              onClick={() => void handleOfficialSubmit()}
              disabled={submitLoading || loading}
              variant="outline"
              className="h-8 border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-100 hover:bg-amber-500/20"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluare...
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4" />
                  Trimite
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
  )

  const editorPane = (
    <div className="h-full overflow-hidden">
      <Editor
        height="100%"
        language={activeFile ? monacoLanguageForFile(activeFile) : "plaintext"}
        theme={settings.theme}
        defaultValue={activeFile?.content || ""}
        path={activeFile ? `${activeFile.id}/${activeFile.name}` : undefined}
        keepCurrentModel
        beforeMount={handleEditorBeforeMount}
        onMount={handleEditorMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: true },
          fontSize: settings.fontSize,
          fontFamily: editorFontFamily,
          mouseWheelZoom: true,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </div>
  )

  const terminalPanel = (
    <div
      className={cn(
        "h-full flex flex-col bg-[#181818] border-t border-[#3b3b3b]",
        isLearningPathPresentation && "border-t-0 bg-[#141820]",
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#3b3b3b]">
        <div className="text-sm font-semibold text-gray-300">Console</div>
        <button
          onClick={() => setIsTerminalOpen(false)}
          className="p-1 hover:bg-[#2d2d2d] rounded transition-colors"
          title="Close Terminal"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className={cn("flex-1 flex min-h-0", isLearningPathPresentation && "max-md:flex-col")}>
        <div
          className={cn(
            "flex-1 flex flex-col min-h-0",
            stdinSidebarVisible && "border-r border-[#3b3b3b]",
            isLearningPathPresentation && stdinSidebarVisible && "max-md:border-r-0",
          )}
        >
          <div className="px-4 py-2 border-b border-[#3b3b3b] bg-[#1e1e1e] shrink-0">
            <div className="text-xs font-semibold text-gray-400">Output:</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {loading && pythonLiveStdout === null && (
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{runHint}</span>
              </div>
            )}

            {loading && pythonLiveStdout !== null && (
              <div className="flex items-center gap-2 text-amber-200/90 text-xs mb-2 font-mono">
                <Loader2 className="w-4 h-4 animate-spin" />
                Rulează — răspunde în zona de mai jos când apare.
              </div>
            )}

            {pythonLiveStdout !== null && (
              <div className="space-y-2 mb-2">
                {pythonLiveStderr !== null && pythonLiveStderr.length > 0 ? (
                  <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                    <span className="font-semibold">Stderr:</span>
                    {"\n"}
                    {pythonLiveStderr}
                  </div>
                ) : null}
                <div className="text-green-400 font-mono text-sm whitespace-pre-wrap">{pythonLiveStdout}</div>
              </div>
            )}

            {error && (
              <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                Error: {error}
              </div>
            )}

            {!loading && !error && output && pythonLiveStdout === null && (
              <div className="space-y-2">
                {output.compile_output && (
                  <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                    <span className="font-semibold">Compilation Error:</span>
                    {"\n"}
                    {output.compile_output}
                  </div>
                )}

                {output.stderr && (
                  <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                    <span className="font-semibold">{output.status.description}:</span>
                    {"\n"}
                    {output.stderr}
                  </div>
                )}

                {output.stdout && (
                  <div className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                    {output.stdout}
                  </div>
                )}

                {!output.stdout && !output.stderr && !output.compile_output && (
                  <div className="text-gray-400 font-mono text-sm">
                    Status: {output.status.description}
                    {output.time && ` (Time: ${output.time}s)`}
                    {output.memory && ` (Memory: ${output.memory} KB)`}
                  </div>
                )}
              </div>
            )}

            {!loading && !error && !output && pythonLiveStdout === null && (
              <div className="text-gray-500 text-sm italic">
                {problemSlug && defaultLanguage === "python"
                  ? "Apasă „Run Code” pentru test local sau „Trimite” pentru evaluare pe server."
                  : 'Click "Run Code" to execute your program'}
              </div>
            )}
          </div>

          {waitingForPythonConsoleLine && activeFile?.type === "python" ? (
            <div className="border-t border-[#3b3b3b] bg-[#1e1e1e]/90 px-4 py-2 shrink-0">
              <div className="text-xs font-semibold text-yellow-400 mb-2">
                Introdu o linie (input / sys.stdin.readline). Pentru sys.stdin.read(), apasă EOF când ai terminat:
              </div>
              <div className="flex gap-2">
                <Input
                  value={pythonConsoleLineInput}
                  onChange={(e) => setPythonConsoleLineInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      submitPythonTerminalLine()
                    }
                  }}
                  placeholder="Valoarea liniei și Enter"
                  className="flex-1 bg-[#2d2d2d] border-[#3b3b3b] text-white text-sm font-mono focus:border-yellow-500"
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={submitPythonTerminalLine}
                  className="bg-green-600 hover:bg-green-700 text-white shrink-0 px-4"
                >
                  Trimite
                </Button>
                <Button
                  type="button"
                  onClick={submitPythonTerminalEof}
                  variant="outline"
                  className="border-yellow-500/40 bg-yellow-500/10 text-yellow-100 hover:bg-yellow-500/20 shrink-0 px-4"
                >
                  EOF
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {stdinSidebarVisible ? (
          <div
            className={cn(
              "w-[480px] shrink-0 flex flex-col bg-[#1a1a1a] min-h-0",
              isLearningPathPresentation && "max-lg:w-[320px] max-md:h-[180px] max-md:w-full max-md:border-t max-md:border-[#3b3b3b]",
            )}
          >
            <div className="px-4 py-2 border-b border-[#3b3b3b] bg-[#1e1e1e]">
              <div className="text-xs font-semibold text-gray-400">Input (stdin):</div>
            </div>

            <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-xs text-gray-400 mb-2">
                  Enter program inputs (one per line):
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Example:&#10;10&#10;20&#10;John&#10;3.14"
                  className="flex-1 min-h-[120px] px-3 py-2 bg-[#2d2d2d] border border-[#3b3b3b] rounded text-white text-sm font-mono resize-none focus:outline-none focus:border-green-600 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  const collapsedTerminal = (
    <div className="border-t border-[#3b3b3b] bg-[#181818] px-4 py-2 flex items-center justify-between">
      <div className="text-sm font-semibold text-gray-300">Terminal</div>
      <button
        onClick={() => setIsTerminalOpen(true)}
        className="p-1 hover:bg-[#2d2d2d] rounded transition-colors"
        title="Open Terminal"
      >
        <ChevronUp className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )

  const submitOverlay =
    problemSlug && defaultLanguage === "python" ? (
      <CodingSubmitResultOverlay
        open={submitLoading || Boolean(submitError) || Boolean(submitResult)}
        loading={submitLoading}
        error={submitError}
        result={submitResult}
        onClose={() => {
          submitDismissedRef.current = true
          setSubmitLoading(false)
          setSubmitResult(null)
          setSubmitError(null)
        }}
        onAcceptedContinue={onAcceptedContinue}
      />
    ) : null

  if (isLearningPathPresentation) {
    return (
      <>
        <div
          className="flex h-full min-h-0 flex-col gap-4 bg-transparent"
          style={{ touchAction: "pan-y" }}
        >
          <section className="flex min-h-[460px] flex-[3] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#060b10] shadow-[0_8px_24px_rgba(3,7,18,0.12)]">
            {fileTabs}
            <div className="min-h-0 flex-1">{editorPane}</div>
          </section>

          <section className="flex min-h-[240px] flex-[1] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#141820] shadow-[0_6px_20px_rgba(3,7,18,0.1)]">
            {isTerminalOpen ? terminalPanel : collapsedTerminal}
          </section>
        </div>
        {submitOverlay}
      </>
    )
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-black"
      style={{ touchAction: "pan-y" }}
    >
      {fileTabs}

      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={isTerminalOpen ? 70 : 100} minSize={30}>
          {editorPane}
        </ResizablePanel>

        {isTerminalOpen && (
          <>
            <ResizableHandle
              withHandle
              className="bg-[#3b3b3b] hover:bg-[#4b4b4b] transition-colors"
            />
            <ResizablePanel defaultSize={30} minSize={10}>
              {terminalPanel}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {!isTerminalOpen && (
        collapsedTerminal
      )}

      {submitOverlay}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

// Lazy load Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  ),
})
import { Loader2, Play, Plus, X, File, FileCode, ChevronDown, ChevronUp } from "lucide-react"
import axios from "axios"
import type { editor as MonacoEditor } from "monaco-editor"
import {
  getFontStack,
  PlanckCodeThemeId,
  usePlanckCodeSettings,
} from "@/components/planckcode-settings-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

const defaultCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`

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

interface FileItem {
  id: string
  name: string
  content: string
  type: "cpp" | "txt"
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

interface EmbeddedIDEProps {
  initialCode?: string
}

export default function EmbeddedIDE({ initialCode }: EmbeddedIDEProps) {
  const { settings } = usePlanckCodeSettings()
  const editorFontFamily = getFontStack(settings.font)
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      name: "main.cpp",
      content: initialCode || defaultCode,
      type: "cpp",
    },
  ])
  const [activeFileId, setActiveFileId] = useState<string>("1")
  const [output, setOutput] = useState<RunResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true)
  const [stdin, setStdin] = useState<string>("")

  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)

  const activeFile = files.find((f) => f.id === activeFileId) || files[0]

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
      model = monaco.editor.createModel(
        file.content,
        file.type === "cpp" ? "cpp" : "plaintext",
        uri
      )
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

    const language = file.type === "cpp" ? "cpp" : "plaintext"
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

  const handleRunCode = async () => {
    if (!isTerminalOpen) {
      setIsTerminalOpen(true)
    }

    setLoading(true)
    setError(null)
    setOutput(null)

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

  return (
    <div 
      className="h-full flex flex-col overflow-hidden bg-black"
      style={{ touchAction: 'pan-y' }}
    >
      {/* File Tabs */}
      <div className="flex items-center justify-between gap-1 px-4 py-2 bg-[#1e1e1e] border-b border-[#3b3b3b] overflow-x-auto">
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
              {file.type === "cpp" ? <FileCode className="w-4 h-4" /> : <File className="w-4 h-4" />}
              <span>{file.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-4">
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
        </div>
      </div>

      {/* Editor and Terminal Section */}
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={isTerminalOpen ? 70 : 100} minSize={30}>
          <div className="h-full overflow-hidden">
            <Editor
              height="100%"
              language={activeFile?.type === "cpp" ? "cpp" : "plaintext"}
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
        </ResizablePanel>

        {isTerminalOpen && (
          <>
            <ResizableHandle
              withHandle
              className="bg-[#3b3b3b] hover:bg-[#4b4b4b] transition-colors"
            />
            <ResizablePanel defaultSize={30} minSize={10}>
              <div className="h-full flex flex-col bg-[#181818] border-t border-[#3b3b3b]">
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

                <div className="flex-1 flex min-h-0">
                  <div className="flex-1 flex flex-col border-r border-[#3b3b3b]">
                    <div className="px-4 py-2 border-b border-[#3b3b3b] bg-[#1e1e1e]">
                      <div className="text-xs font-semibold text-gray-400">Output:</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {loading && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Compiling and running your code...</span>
                        </div>
                      )}

                      {error && (
                        <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                          Error: {error}
                        </div>
                      )}

                      {!loading && !error && output && (
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
                              <span className="font-semibold">Runtime Error:</span>
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

                      {!loading && !error && !output && (
                        <div className="text-gray-500 text-sm italic">
                          Click "Run Code" to execute your program
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-[480px] flex flex-col bg-[#1a1a1a]">
                    <div className="px-4 py-2 border-b border-[#3b3b3b] bg-[#1e1e1e]">
                      <div className="text-xs font-semibold text-gray-400">Input (stdin):</div>
                    </div>

                    <div className="flex-1 flex flex-col p-4 gap-3">
                      <div className="flex-1 flex flex-col">
                        <label className="text-xs text-gray-400 mb-2">
                          Enter program inputs (one per line):
                        </label>
                        <textarea
                          value={stdin}
                          onChange={(e) => setStdin(e.target.value)}
                          placeholder="Example:&#10;10&#10;20&#10;John&#10;3.14"
                          className="flex-1 px-3 py-2 bg-[#2d2d2d] border border-[#3b3b3b] rounded text-white text-sm font-mono resize-none focus:outline-none focus:border-green-600 placeholder-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {!isTerminalOpen && (
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
      )}
    </div>
  )
}


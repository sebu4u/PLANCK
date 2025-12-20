'use client'

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

// Lazy load Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  ),
})
import { Card, CardContent } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { PlanckCodeSidebar } from '@/components/planckcode-sidebar'
import { Loader2, Play, Plus, X, File, FileCode, ChevronDown, ChevronUp, Bug, Sparkles, Check } from 'lucide-react'
import axios from 'axios'
import { InsightIdeChat } from '@/components/insight-ide-chat'
import type { editor as MonacoEditor } from 'monaco-editor'
import {
  getFontStack,
  PlanckCodeThemeId,
  usePlanckCodeSettings,
} from '@/components/planckcode-settings-provider'
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
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"

const defaultCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`

const STORAGE_KEY = 'planckcode-ide-state'

const MONACO_THEME_DEFINITIONS: Record<PlanckCodeThemeId, MonacoEditor.IStandaloneThemeData> = {
  'planck-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5B9273' },
      { token: 'keyword', foreground: '5DE4C7', fontStyle: 'bold' },
      { token: 'string', foreground: 'F9E2AF' },
      { token: 'number', foreground: '80CBC4' },
      { token: 'type', foreground: '7AA2F7' },
      { token: 'function', foreground: '9CDCFE' },
    ],
    colors: {
      'editor.background': '#060B10',
      'editor.foreground': '#F8FBFB',
      'editorCursor.foreground': '#5DE4C7',
      'editorLineNumber.foreground': '#3A4A4F',
      'editorLineNumber.activeForeground': '#8FE3D6',
      'editor.selectionBackground': '#124C3A',
      'editor.inactiveSelectionBackground': '#0C2F23',
      'editor.lineHighlightBackground': '#0C1A22',
      'editorIndentGuide.background': '#142126',
      'editorIndentGuide.activeBackground': '#255043',
    },
    semanticHighlighting: true,
  },
  'planck-nebula': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '756499', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C19CFF', fontStyle: 'bold' },
      { token: 'string', foreground: 'F7C1FF' },
      { token: 'number', foreground: '9CDCFE' },
      { token: 'type', foreground: '8BD5FF' },
      { token: 'function', foreground: 'FFD6FF' },
    ],
    colors: {
      'editor.background': '#120A1E',
      'editor.foreground': '#F8EAFF',
      'editorCursor.foreground': '#C19CFF',
      'editorLineNumber.foreground': '#3F2F57',
      'editorLineNumber.activeForeground': '#C19CFF',
      'editor.selectionBackground': '#2A1747',
      'editor.inactiveSelectionBackground': '#201239',
      'editor.lineHighlightBackground': '#1C1031',
      'editorIndentGuide.background': '#2A1C44',
      'editorIndentGuide.activeBackground': '#4E2D7D',
    },
    semanticHighlighting: true,
  },
  'planck-classic': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '808080', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorCursor.foreground': '#AEAFAD',
      'editorLineNumber.foreground': '#5A5A5A',
      'editorLineNumber.activeForeground': '#CCCCCC',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editor.lineHighlightBackground': '#2A2A2A',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
    },
    semanticHighlighting: true,
  },
}

const ensureMonacoThemes = (monaco: typeof import('monaco-editor')) => {
  const themeIds = Object.keys(MONACO_THEME_DEFINITIONS) as PlanckCodeThemeId[]
  themeIds.forEach((themeId) => {
    monaco.editor.defineTheme(themeId, MONACO_THEME_DEFINITIONS[themeId])
  })
}

interface FileItem {
  id: string
  name: string
  content: string
  type: 'cpp' | 'txt'
}

type InsightCodeEditChange =
  | {
    type: 'insert'
    line?: number
    content?: string
  }
  | {
    type: 'delete'
    start?: number
    end?: number
  }
  | {
    type: 'replace'
    start?: number
    end?: number
    content?: string
  }

interface InsightCodeEditResponse {
  type: 'code_edit'
  target?: {
    file_name?: string
  }
  explanation?: string
  changes: InsightCodeEditChange[]
  full_content?: string
}

interface InsightHighlightRange {
  startLine: number
  endLine: number
}

interface PendingInsightEdit {
  fileId: string
  previousContent: string
  newContent: string
  insertHighlights: InsightHighlightRange[]
  deleteHighlights: InsightHighlightRange[]
  explanation?: string
}

const normalizeNewlines = (content: string) => content.replace(/\r\n/g, '\n')

const splitLines = (content: string): string[] => normalizeNewlines(content).split('\n')

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return min
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

const getChangeReferenceLine = (change: InsightCodeEditChange) => {
  switch (change.type) {
    case 'insert':
      return change.line ?? change.start ?? change.end
    case 'delete':
      return change.start ?? change.end ?? change.line
    case 'replace':
      return change.start ?? change.end ?? change.line
    default:
      return undefined
  }
}

const resolveRawRange = (
  change: Extract<InsightCodeEditChange, { type: 'delete' | 'replace' }>,
  fallbackLine: number
) => {
  const candidateStart =
    change.type === 'delete'
      ? change.start ?? change.line ?? change.end
      : change.start ?? change.line ?? change.end
  const candidateEnd =
    change.type === 'delete'
      ? change.end ?? change.start ?? change.line
      : change.end ?? change.start ?? change.line

  let rawStart = candidateStart ?? fallbackLine
  let rawEnd = candidateEnd ?? rawStart

  if (!Number.isFinite(rawStart)) {
    rawStart = fallbackLine
  }
  if (!Number.isFinite(rawEnd)) {
    rawEnd = rawStart
  }

  if (rawStart > rawEnd) {
    return { rawStart: rawEnd, rawEnd: rawStart }
  }

  return { rawStart, rawEnd }
}

const applyInsightChangesToContent = (
  originalContent: string,
  changes: InsightCodeEditChange[]
): {
  content: string
  insertHighlights: InsightHighlightRange[]
  deleteHighlights: InsightHighlightRange[]
} | null => {
  if (!changes || changes.length === 0) {
    return null
  }

  const workingLines = splitLines(originalContent)
  const insertHighlights: InsightHighlightRange[] = []
  const deleteHighlights: InsightHighlightRange[] = []

  // Sort changes in ASCENDING order to apply from top to bottom
  // This way, line numbers remain valid as we process changes
  const sortedChanges = [...changes].sort((a, b) => {
    const refA = getChangeReferenceLine(a) ?? 0
    const refB = getChangeReferenceLine(b) ?? 0
    return refA - refB
  })

  console.log("IDE: Applying changes to content (ascending order):", sortedChanges)

  // Track line offset as we apply changes
  let lineOffset = 0

  sortedChanges.forEach((change, index) => {
    console.log(`IDE: Processing change ${index} (offset: ${lineOffset}):`, change)

    if (change.type === 'insert') {
      const rawLine = change.line ?? workingLines.length + 1
      // Apply offset to get actual position in modified content
      const insertionIndex = clamp(Math.round(rawLine) + lineOffset, 1, workingLines.length + 1)
      const newLines = splitLines(change.content ?? '')
      console.log(`IDE: Inserting ${newLines.length} lines at position ${insertionIndex} (original: ${rawLine})`)
      workingLines.splice(insertionIndex - 1, 0, ...newLines)
      if (newLines.length > 0) {
        insertHighlights.push({
          startLine: insertionIndex,
          endLine: insertionIndex + newLines.length - 1
        })
        // Update offset: we added lines
        lineOffset += newLines.length
      }
    } else if (change.type === 'delete') {
      if (workingLines.length === 0) {
        console.warn("IDE: Cannot delete from empty content")
        return
      }
      const { rawStart, rawEnd } = resolveRawRange(change, workingLines.length)
      // Apply offset to get actual positions
      const start = clamp(Math.round(rawStart) + lineOffset, 1, workingLines.length)
      const end = clamp(Math.round(rawEnd) + lineOffset, start, workingLines.length)
      const deletedCount = end - start + 1
      console.log(`IDE: Deleting lines ${start} to ${end} (original: ${rawStart}-${rawEnd}, ${deletedCount} lines)`)
      console.log(`IDE: Lines to delete:`, workingLines.slice(start - 1, end))
      workingLines.splice(start - 1, deletedCount)
      // Highlight the line where deletion occurred
      const highlightLine = clamp(start, 1, Math.max(workingLines.length, 1))
      deleteHighlights.push({
        startLine: highlightLine,
        endLine: highlightLine
      })
      // Update offset: we removed lines
      lineOffset -= deletedCount
    } else if (change.type === 'replace') {
      if (workingLines.length === 0) {
        const newLines = splitLines(change.content ?? '')
        workingLines.splice(0, 0, ...newLines)
        if (newLines.length > 0) {
          insertHighlights.push({
            startLine: 1,
            endLine: newLines.length
          })
          lineOffset += newLines.length
        }
        return
      }
      const { rawStart, rawEnd } = resolveRawRange(change, workingLines.length)
      // Apply offset to get actual positions
      const start = clamp(Math.round(rawStart) + lineOffset, 1, workingLines.length)
      const end = clamp(Math.round(rawEnd) + lineOffset, start, workingLines.length)
      const newLines = splitLines(change.content ?? '')
      const deletedCount = end - start + 1
      console.log(`IDE: Replacing lines ${start} to ${end} (original: ${rawStart}-${rawEnd}) with ${newLines.length} new lines`)
      console.log(`IDE: Old lines:`, workingLines.slice(start - 1, end))
      console.log(`IDE: New lines:`, newLines)
      workingLines.splice(start - 1, deletedCount, ...newLines)
      if (newLines.length > 0) {
        insertHighlights.push({
          startLine: start,
          endLine: start + newLines.length - 1
        })
      }
      // Mark the replaced area for deletion highlight
      deleteHighlights.push({
        startLine: start,
        endLine: start
      })
      // Update offset: we replaced deletedCount lines with newLines.length lines
      lineOffset += newLines.length - deletedCount
    }
  })

  console.log("IDE: Final content lines:", workingLines.length)
  console.log("IDE: Insert highlights:", insertHighlights)
  console.log("IDE: Delete highlights:", deleteHighlights)

  return {
    content: workingLines.join('\n'),
    insertHighlights,
    deleteHighlights
  }
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

function IDEPageContent() {
  const { settings } = usePlanckCodeSettings()
  const editorFontFamily = getFontStack(settings.font)
  const [showUpgradeCard, setShowUpgradeCard] = useState<boolean>(true)
  const [upgradeStarsMounted, setUpgradeStarsMounted] = useState(false)
  const upgradeStars = useMemo(() => {
    if (!upgradeStarsMounted) return []

    const starAreaWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 960) : 960

    return Array.from({ length: 18 }, (_, i) => {
      const seed = i * 0.618033988749895
      const random = (seed: number) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }

      return {
        id: i,
        x: random(seed) * starAreaWidth,
        y: random(seed + 1) * 320,
        opacity: random(seed + 2) * 0.5 + 0.25,
        scale: random(seed + 3) * 0.6 + 0.4,
        width: random(seed + 4) * 2 + 1,
        height: random(seed + 5) * 2 + 1,
        animateY: random(seed + 6) * -18,
        animateOpacity: random(seed + 7) * 0.3 + 0.2,
        duration: random(seed + 8) * 4 + 5,
      }
    })
  }, [upgradeStarsMounted])
  useEffect(() => {
    setUpgradeStarsMounted(true)
  }, [])

  // Load saved state from localStorage on mount
  const loadSavedState = (): { files: FileItem[], activeFileId: string } | null => {
    if (typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate the structure
        if (
          parsed &&
          Array.isArray(parsed.files) &&
          parsed.files.length > 0 &&
          typeof parsed.activeFileId === 'string'
        ) {
          // Ensure all required fields exist
          const validFiles = parsed.files.every((f: any) =>
            f && typeof f.id === 'string' && typeof f.name === 'string' &&
            typeof f.content === 'string' && (f.type === 'cpp' || f.type === 'txt')
          )

          if (validFiles) {
            // Ensure activeFileId exists in files, otherwise use first file
            const activeFileExists = parsed.files.find((f: FileItem) => f.id === parsed.activeFileId)
            return {
              files: parsed.files,
              activeFileId: activeFileExists ? parsed.activeFileId : parsed.files[0].id
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load IDE state from localStorage:', error)
    }
    return null
  }

  const savedState = loadSavedState()
  const [files, setFiles] = useState<FileItem[]>(() => {
    return savedState?.files || [{ id: '1', name: 'main.cpp', content: defaultCode, type: 'cpp' }]
  })
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return savedState?.activeFileId || '1'
  })
  // Streaming state for glow effect
  const [isStreamingCode, setIsStreamingCode] = useState(false)
  const [output, setOutput] = useState<RunResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true)
  const [stdin, setStdin] = useState<string>('')
  const [isInsightOpen, setIsInsightOpen] = useState<boolean>(false)
  const searchParams = useSearchParams()

  // Interactive execution state
  const [isInteractiveMode, setIsInteractiveMode] = useState<boolean>(true)
  const [interactiveOutput, setInteractiveOutput] = useState<string>('')
  const [waitingForInput, setWaitingForInput] = useState<boolean>(false)
  const [currentStdinInput, setCurrentStdinInput] = useState<string>('')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [compilerAvailable, setCompilerAvailable] = useState<boolean | null>(null)
  const [pendingInsightEdit, setPendingInsightEdit] = useState<PendingInsightEdit | null>(null)

  // Save state to localStorage whenever files or activeFileId changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stateToSave = {
        files,
        activeFileId
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (error) {
      console.warn('Failed to save IDE state to localStorage:', error)
    }
  }, [files, activeFileId])

  // Auto-open Insight sidebar based on query param (e.g., ?agent=open)
  useEffect(() => {
    const intent = searchParams?.get('agent')
    if (intent === 'open') {
      setIsInsightOpen(true)
    }
  }, [searchParams])

  // New file dialog state
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState<boolean>(false)
  const [newFileName, setNewFileName] = useState<string>('')
  const [newFileType, setNewFileType] = useState<'cpp' | 'txt'>('txt')

  // Editor references
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const insightDecorationsRef = useRef<string[]>([])
  const skipModelSyncRef = useRef<Set<string>>(new Set())
  const streamingEditRef = useRef<{ fileId: string; content: string } | null>(null)
  const streamingCancelRef = useRef<(() => void) | null>(null)
  const streamingActiveRef = useRef<Set<string>>(new Set())

  const activeFile = files.find(f => f.id === activeFileId) || files[0]

  const getModelUri = (file: FileItem) => {
    return monacoRef.current?.Uri.parse(`inmemory://model/${file.id}/${file.name}`)
  }

  const ensureModelForFile = (file: FileItem, options?: { skipValueSync?: boolean }) => {
    if (!monacoRef.current) return null
    const monaco = monacoRef.current
    const uri = getModelUri(file)
    if (!uri) return null

    let model = monaco.editor.getModel(uri)

    if (!model) {
      model = monaco.editor.createModel(
        file.content,
        file.type === 'cpp' ? 'cpp' : 'plaintext',
        uri
      )
    } else if (!options?.skipValueSync && model.getValue() !== file.content) {
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

    const language = file.type === 'cpp' ? 'cpp' : 'plaintext'
    if (monacoRef.current && model.getLanguageId() !== language) {
      monacoRef.current.editor.setModelLanguage(model, language)
    }
  }

  useEffect(() => {
    if (!activeFile) return
    switchToFileModel(activeFile)
  }, [activeFileId, activeFile?.type])

  useEffect(() => {
    files.forEach(file => {
      const shouldSkip = file.id === activeFileId && skipModelSyncRef.current.has(file.id)
      ensureModelForFile(file, { skipValueSync: shouldSkip })
      if (shouldSkip) {
        skipModelSyncRef.current.delete(file.id)
      }
    })
  }, [files, activeFileId])

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

  const parseFileUpdates = (stdout: string) => {
    if (!stdout) return

    // Parse sections like: "=== Content of filename ===\n...content...\n"
    const lines = stdout.split('\n')
    let i = 0
    const updates: Record<string, string> = {}

    while (i < lines.length) {
      const line = lines[i]
      const match = line.match(/^=== Content of (.+?) ===\s*$/)
      if (match) {
        const fileName = match[1].trim()
        let j = i + 1
        const contentLines: string[] = []
        while (j < lines.length && !lines[j].startsWith('=== Content of ')) {
          contentLines.push(lines[j])
          j++
        }
        updates[fileName] = contentLines.join('\n').replace(/\s+$/, '')
        i = j
      } else {
        i++
      }
    }

    if (Object.keys(updates).length > 0) {
      setFiles(prev => prev.map(f => {
        if (f.type === 'txt' && updates[f.name] !== undefined) {
          return { ...f, content: updates[f.name] }
        }
        return f
      }))
    }
  }

  const handleSendStdin = async () => {
    if (!currentSessionId || !currentStdinInput.trim()) return

    try {
      const response = await fetch('/api/run-interactive', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          stdin: currentStdinInput
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send stdin')
      }

      // Add input to output display
      setInteractiveOutput(prev => prev + currentStdinInput + '\n')
      setCurrentStdinInput('')
      setWaitingForInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send input')
    }
  }

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      return
    }

    const trimmedName = newFileName.trim()
    let fileName: string

    if (newFileType === 'cpp') {
      // For C++ files, always ensure .cpp extension
      fileName = trimmedName.endsWith('.cpp')
        ? trimmedName
        : trimmedName + '.cpp'
    } else {
      // For text files, check if filename already has an extension
      // If it contains a dot (not at the start), assume it has an extension
      const hasExtension = trimmedName.includes('.') && trimmedName.indexOf('.') > 0
      fileName = hasExtension
        ? trimmedName
        : trimmedName + '.txt'
    }

    // Check if file already exists
    if (files.some(f => f.name === fileName)) {
      alert('A file with this name already exists!')
      return
    }

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: fileName,
      content: newFileType === 'cpp'
        ? '// Write your C++ code here\n'
        : '',
      type: newFileType
    }

    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setIsNewFileDialogOpen(false)
    setNewFileName('')
    setNewFileType('txt')
  }

  const handleDeleteFile = (fileId: string) => {
    // Don't delete if it's the last file
    if (files.length === 1) {
      alert('You must have at least one file!')
      return
    }

    const fileIndex = files.findIndex(f => f.id === fileId)
    const newFiles = files.filter(f => f.id !== fileId)
    setFiles(newFiles)

    // If deleting active file, switch to another
    if (activeFileId === fileId) {
      const newActiveIndex = Math.max(0, fileIndex - 1)
      setActiveFileId(newFiles[newActiveIndex].id)
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile) return
    if (streamingActiveRef.current.has(activeFileId)) {
      return
    }
    const newValue = value ?? ''

    skipModelSyncRef.current.add(activeFileId)

    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === activeFileId
          ? { ...f, content: newValue }
          : f
      )
    )
  }

  const handleMoveFile = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return

    const draggedIndex = files.findIndex(f => f.id === draggedId)
    const targetIndex = files.findIndex(f => f.id === targetId)
    if (draggedIndex === -1 || targetIndex === -1) return

    const updatedFiles = [...files]
    const [draggedFile] = updatedFiles.splice(draggedIndex, 1)
    updatedFiles.splice(targetIndex, 0, draggedFile)
    setFiles(updatedFiles)

    // Keep active file selection consistent with new order
    setActiveFileId(draggedFile.id)
  }

  const handleInsertCodeFromInsight = useCallback((code: string) => {
    if (!activeFileId) return

    // Update file content state
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === activeFileId ? { ...file, content: code } : file
      )
    )

    // Trigger streaming animation
    skipModelSyncRef.current.add(activeFileId)
    streamingEditRef.current = {
      fileId: activeFileId,
      content: code
    }
  }, [activeFileId])

  const clearInsightDecorations = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    insightDecorationsRef.current = editor.deltaDecorations(insightDecorationsRef.current, [])
  }, [])

  const applyInsightDecorations = useCallback(
    (insertHighlights: InsightHighlightRange[], deleteHighlights: InsightHighlightRange[]) => {
      const editor = editorRef.current
      const monaco = monacoRef.current
      const model = editor?.getModel()
      if (!editor || !monaco || !model) return

      const totalLines = model.getLineCount() || 1

      const decorations = [
        ...insertHighlights.map((range) => {
          const startLine = clamp(range.startLine, 1, totalLines)
          const endLine = clamp(range.endLine, startLine, totalLines)
          return {
            range: new monaco.Range(
              startLine,
              1,
              endLine,
              model.getLineMaxColumn(endLine)
            ),
            options: {
              isWholeLine: true,
              className: 'insight-insert-highlight'
            }
          }
        }),
        ...deleteHighlights.map((range) => {
          const startLine = clamp(range.startLine, 1, totalLines)
          const endLine = clamp(range.endLine, startLine, totalLines)
          return {
            range: new monaco.Range(
              startLine,
              1,
              endLine,
              model.getLineMaxColumn(endLine)
            ),
            options: {
              isWholeLine: true,
              className: 'insight-delete-highlight'
            }
          }
        })
      ]

      insightDecorationsRef.current = editor.deltaDecorations(
        insightDecorationsRef.current,
        decorations
      )
    },
    [editorRef, monacoRef]
  )

  // Apply decorations when pendingInsightEdit changes and model is updated
  useEffect(() => {
    if (!pendingInsightEdit) {
      clearInsightDecorations()
      return
    }

    const editor = editorRef.current
    const model = editor?.getModel()
    if (!editor || !model) return

    // Wait for model to be synced with file content
    const checkAndApply = () => {
      const activeFile = files.find(f => f.id === pendingInsightEdit!.fileId)
      if (!activeFile) return

      const modelContent = model.getValue()
      if (modelContent === activeFile.content) {
        console.log("IDE: Model synced, applying decorations")
        applyInsightDecorations(
          pendingInsightEdit.insertHighlights,
          pendingInsightEdit.deleteHighlights
        )
      } else {
        // Retry after a short delay
        setTimeout(checkAndApply, 50)
      }
    }

    // Initial check after a short delay to allow React to update
    setTimeout(checkAndApply, 100)
  }, [pendingInsightEdit, files, applyInsightDecorations, clearInsightDecorations])

  const handleApplyCodeEdit = useCallback(
    (edit: InsightCodeEditResponse): boolean => {
      console.log("IDE: handleApplyCodeEdit called with:", edit)
      if (!edit?.full_content && (!edit?.changes || edit.changes.length === 0)) {
        console.warn("IDE: No applicable changes or full content provided", edit)
        return false
      }

      let pendingResult: PendingInsightEdit | null = null

      setFiles((prevFiles) => {
        const targetName = edit.target?.file_name
        console.log("IDE: Looking for file:", targetName, "activeFileId:", activeFileId)
        const fileIndex = targetName
          ? prevFiles.findIndex((file) => file.name === targetName)
          : prevFiles.findIndex((file) => file.id === activeFileId)

        if (fileIndex === -1) {
          console.warn("IDE: File not found, available files:", prevFiles.map(f => f.name))
          return prevFiles
        }

        const targetFile = prevFiles[fileIndex]

        const applyFullContent = edit.full_content
          ? normalizeNewlines(edit.full_content)
          : null

        if (applyFullContent !== null) {
          if (applyFullContent === targetFile.content) {
            console.log("IDE: Full content identical to current content, nothing to apply")
            return prevFiles
          }
          if (targetFile.id === activeFileId) {
            skipModelSyncRef.current.add(targetFile.id)
            streamingEditRef.current = { fileId: targetFile.id, content: applyFullContent }
          }
          console.log("IDE: Applying full content update. Length:", applyFullContent.length)
          pendingResult = {
            fileId: targetFile.id,
            previousContent: targetFile.content,
            newContent: applyFullContent,
            insertHighlights: [],
            deleteHighlights: [],
            explanation: edit.explanation
          }

          const updatedFiles = [...prevFiles]
          updatedFiles[fileIndex] = {
            ...targetFile,
            content: applyFullContent
          }
          return updatedFiles
        }

        console.log("IDE: Applying diff changes to file:", targetFile.name, "changes:", edit.changes)
        const applyResult = applyInsightChangesToContent(targetFile.content, edit.changes)

        if (!applyResult) {
          console.warn("IDE: applyInsightChangesToContent returned null")
          return prevFiles
        }

        console.log("IDE: Changes applied successfully, new content length:", applyResult.content.length)

        if (targetFile.id === activeFileId) {
          skipModelSyncRef.current.add(targetFile.id)
          streamingEditRef.current = { fileId: targetFile.id, content: applyResult.content }
        }

        pendingResult = {
          fileId: targetFile.id,
          previousContent: targetFile.content,
          newContent: applyResult.content,
          insertHighlights: [],
          deleteHighlights: [],
          explanation: edit.explanation
        }

        const updatedFiles = [...prevFiles]
        updatedFiles[fileIndex] = {
          ...targetFile,
          content: applyResult.content
        }
        return updatedFiles
      })

      if (pendingResult) {
        console.log("IDE: Setting pending edit")
        clearInsightDecorations()
        setPendingInsightEdit(pendingResult)
        // Decorations will be applied automatically via useEffect when model is synced
        return true
      }

      console.warn("IDE: No pending result created")
      return false
    },
    [activeFileId, applyInsightDecorations, clearInsightDecorations, setFiles]
  )

  const handleConfirmInsightEdit = useCallback(() => {
    clearInsightDecorations()
    setPendingInsightEdit(null)
  }, [clearInsightDecorations])

  const handleUndoInsightEdit = useCallback(() => {
    setPendingInsightEdit((current) => {
      if (!current) {
        return null
      }

      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === current.fileId ? { ...file, content: current.previousContent } : file
        )
      )
      clearInsightDecorations()
      return null
    })
  }, [clearInsightDecorations, setFiles])

  useEffect(() => {
    const task = streamingEditRef.current
    if (!task) {
      return
    }

    if (task.fileId !== activeFileId) {
      streamingEditRef.current = null
      skipModelSyncRef.current.delete(task.fileId)
      return
    }

    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor?.getModel()

    if (!editor || !model || !monaco) {
      skipModelSyncRef.current.delete(task.fileId)
      return
    }

    streamingEditRef.current = null
    streamingCancelRef.current?.()

    let cancelled = false
    const finalContent = normalizeNewlines(task.content)
    const totalLength = finalContent.length
    const chunkSize = Math.max(1, Math.floor(totalLength / 200) || 1)
    const chunkDelay = 20

    streamingActiveRef.current.add(task.fileId)
    setIsStreamingCode(true) // Start glow effect
    editor.pushUndoStop()
    model.setValue('')
    editor.pushUndoStop()

    let offset = 0
    let timer: number | null = null

    const applyPartial = (length: number) => {
      const nextValue = finalContent.slice(0, length)
      if (model.getValue() !== nextValue) {
        model.setValue(nextValue)
      }
    }

    const complete = () => {
      applyPartial(totalLength)
      editor.focus()
      const lastLine = model.getLineCount()
      const lastColumn = model.getLineMaxColumn(lastLine)
      editor.setPosition({ lineNumber: lastLine, column: lastColumn })
      editor.revealLineInCenter(lastLine)
      skipModelSyncRef.current.delete(task.fileId)
      streamingActiveRef.current.delete(task.fileId)
      setIsStreamingCode(false) // Stop glow effect
    }

    const tick = () => {
      if (cancelled) {
        complete()
        return
      }

      if (offset >= totalLength) {
        complete()
        return
      }

      offset = Math.min(totalLength, offset + chunkSize)
      applyPartial(offset)
      timer = window.setTimeout(tick, chunkDelay)
    }

    tick()

    const cancel = () => {
      cancelled = true
      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }
      setIsStreamingCode(false) // Stop glow effect
    }

    streamingCancelRef.current = () => {
      cancel()
      complete()
    }

    return () => {
      cancel()
      complete()
      streamingCancelRef.current = null
      streamingActiveRef.current.delete(task.fileId)
      setIsStreamingCode(false) // Ensure glow effect is stopped
    }
  }, [files, activeFileId])

  const handleEditorBeforeMount = (monacoInstance: typeof import('monaco-editor')) => {
    ensureMonacoThemes(monacoInstance)
  }

  const handleEditorMount = (
    editorInstance: import('monaco-editor').editor.IStandaloneCodeEditor,
    monacoInstance: typeof import('monaco-editor')
  ) => {
    editorRef.current = editorInstance
    monacoRef.current = monacoInstance

    ensureMonacoThemes(monacoInstance)
    monacoInstance.editor.setTheme(settings.theme)
    editorInstance.updateOptions({
      fontFamily: editorFontFamily,
      fontSize: settings.fontSize,
    })

    files.forEach(file => ensureModelForFile(file))
    switchToFileModel(activeFile)
  }

  const handleRunCode = async () => {
    const codeRequiresStdin = files.some(
      (file) =>
        file.type === 'cpp' &&
        /\b(std\s*::\s*)?cin\b/.test(file.content)
    )

    if (codeRequiresStdin && (compilerAvailable === false || !isInteractiveMode || compilerAvailable === null) && !stdin.trim()) {
      if (!isTerminalOpen) {
        setIsTerminalOpen(true)
      }
      setError('Programul folosește cin, dar nu ai furnizat valori în "Input (stdin)". Completează-le înainte de a rula codul.')
      setOutput(null)
      setInteractiveOutput('')
      setWaitingForInput(false)
      setCurrentStdinInput('')
      return
    }

    // Open terminal if it's closed
    if (!isTerminalOpen) {
      setIsTerminalOpen(true)
    }

    // Cancel any existing execution
    if (abortController) {
      abortController.abort()
    }

    setLoading(true)
    setError(null)
    setOutput(null)
    setInteractiveOutput('')
    setWaitingForInput(false)
    setCurrentStdinInput('')
    setCurrentSessionId(null)

    // Check if compiler is available for interactive mode
    // If we already know compiler is not available, use standard mode
    if (isInteractiveMode && compilerAvailable !== false) {
      await handleInteractiveRun()
    } else {
      await handleStandardRun()
    }
  }

  const handleInteractiveRun = async () => {
    const controller = new AbortController()
    setAbortController(controller)

    try {
      const response = await fetch('/api/run-interactive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: files.map(f => ({ name: f.name, content: f.content }))
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'session' && data.sessionId) {
                setCurrentSessionId(data.sessionId)
              } else if (data.type === 'stdout' && data.content) {
                setInteractiveOutput(prev => prev + data.content)
                setWaitingForInput(false)
              } else if (data.type === 'stderr' && data.content) {
                setInteractiveOutput(prev => prev + data.content)
              } else if (data.type === 'stdin_request') {
                setWaitingForInput(true)
              } else if (data.type === 'status' && data.message) {
                setInteractiveOutput(prev => prev + `[${data.message}]\n`)
              } else if (data.type === 'done') {
                setLoading(false)
                setWaitingForInput(false)
                // Update output for file parsing
                if (data.stdout) {
                  const runResponse: RunResponse = {
                    stdout: data.stdout,
                    stderr: data.stderr || null,
                    compile_output: null,
                    status: { id: data.exitCode === 0 ? 3 : 11, description: data.exitCode === 0 ? 'Accepted' : 'Runtime Error' },
                    time: null,
                    memory: null
                  }
                  setOutput(runResponse)
                  // Parse file updates if any
                  parseFileUpdates(data.stdout)
                }
              } else if (data.type === 'error') {
                // Check if it's a compiler not available error
                if (data.error === 'LOCAL_COMPILER_NOT_AVAILABLE') {
                  // Mark compiler as not available and fallback to standard run
                  setCompilerAvailable(false)
                  setIsInteractiveMode(false)
                  setWaitingForInput(false)
                  setInteractiveOutput('')

                  // Abort streaming request and fallback to Judge0 standard run
                  controller.abort()
                  await handleStandardRun()
                  return
                } else {
                  setError(data.error)
                  setLoading(false)
                  setWaitingForInput(false)
                }
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError)
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        setLoading(false)
        setWaitingForInput(false)
      }
    } finally {
      setAbortController(null)
    }
  }

  const handleStandardRun = async () => {
    try {
      // Send all files and stdin to the API
      const response = await axios.post<RunResponse>('/api/run', {
        files: files.map(f => ({ name: f.name, content: f.content })),
        stdin: stdin || undefined
      })
      // Always set output, even if there are compilation/runtime errors
      // Those are part of the normal response, not API errors
      setOutput(response.data)

      parseFileUpdates(response.data?.stdout || '')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Network error (no response from server)
        if (!err.response) {
          const errorMessage = err.message || 'Network error: Failed to connect to server'
          setError(errorMessage)
          if (process.env.NODE_ENV === 'development') {
            console.log('Network Error:', {
              message: err.message,
              code: err.code
            })
          }
          return
        }

        // Server responded with error status
        const errorData = err.response.data
        let errorMessage = 'Failed to run code'

        if (errorData) {
          if (typeof errorData === 'string') {
            errorMessage = errorData
          } else if (typeof errorData === 'object') {
            // Check if object has any meaningful properties
            const hasContent = errorData.error || errorData.details || errorData.message
            if (hasContent) {
              errorMessage = errorData.error || errorData.details || errorData.message
            } else {
              // Object is empty or has no meaningful properties
              errorMessage = `Server error (${err.response.status}): ${err.response.statusText || 'Unknown error'}`
            }
          }
        } else {
          errorMessage = `Server error (${err.response.status}): ${err.response.statusText || 'Unknown error'}`
        }

        setError(errorMessage)

        // Only log if there's meaningful data to log
        if (process.env.NODE_ENV === 'development') {
          const logData: Record<string, any> = {
            status: err.response.status,
            statusText: err.response.statusText,
            message: err.message
          }
          if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            logData.data = errorData
          }
          console.log('API Error:', logData)
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        if (process.env.NODE_ENV === 'development') {
          console.log('Unexpected error:', err)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen-mobile bg-black text-white overflow-hidden">
      <StructuredData
        data={breadcrumbStructuredData([
          { name: 'Acasă', url: 'https://www.planck.academy/' },
          { name: 'Planck Code', url: 'https://www.planck.academy/planckcode' },
          { name: 'IDE', url: 'https://www.planck.academy/planckcode/ide' },
        ])}
        id="breadcrumbs-planckcode-ide"
      />
      {showUpgradeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#0c1017]/95 shadow-[0_30px_120px_-25px_rgba(0,0,0,0.95)]">
            <button
              onClick={() => setShowUpgradeCard(false)}
              aria-label="Închide mesajul de upgrade"
              className="absolute right-3 top-3 z-20 rounded-full p-2 text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="absolute inset-0 pointer-events-none opacity-75">
              <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-white/10 blur-[120px]" />
              <div className="absolute inset-0 overflow-hidden">
                {upgradeStars.map((star) => (
                  <motion.div
                    key={star.id}
                    className="absolute bg-white rounded-full"
                    initial={{
                      x: star.x,
                      y: star.y,
                      opacity: star.opacity,
                      scale: star.scale,
                    }}
                    animate={{
                      y: [null, star.animateY],
                      opacity: [null, star.animateOpacity],
                    }}
                    transition={{
                      duration: star.duration,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }}
                    style={{
                      width: `${star.width}px`,
                      height: `${star.height}px`,
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/30" />
            </div>

            <div className="relative z-10 p-7 sm:p-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-white/90 shadow-inner shadow-white/5">
                Planck Code
                <span className="text-white">Beta Update</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Planck Code se upgradează ⚡️
                </h2>
                <p className="text-gray-200 text-base leading-relaxed">
                  Lucrezi azi. Continui mâine. Fără să pierzi nimic.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  În curând vei putea să-ți salvezi proiectele odată cu lansarea planurilor Plus &amp; Pro.
                </p>
              </div>

              <div className="grid gap-2 text-sm text-gray-100">
                {['Mai multe limbaje', 'Probleme exclusive', 'Funcții avansate pentru developerii adevărați'].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-2 border border-white/10">
                    <Check className="mt-0.5 h-4 w-4 text-white" />
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 text-center">
                <p className="text-gray-200 font-semibold">Pregătește-te să treci pe next level.</p>
                <p className="text-xs text-gray-400">
                  👉 Soon: Upgrade &amp; Save
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <Navigation />
      <PlanckCodeSidebar />

      <div className="md:ml-16 mt-16 h-screen-minus-64 flex overflow-hidden">
        <div className={`relative flex-1 flex flex-col overflow-hidden transition-[margin,width] duration-300 ${isInsightOpen ? 'lg:mr-[420px]' : ''}`}>
          {pendingInsightEdit && (
            <div className="absolute right-6 top-3 z-30 flex items-center gap-2 rounded-md bg-[#181818] px-2.5 py-1.5 shadow-lg border border-white/10">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 border border-green-500 text-gray-400 hover:bg-green-500/10"
                onClick={handleConfirmInsightEdit}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 border-white/10 text-gray-400 hover:bg-white/10"
                onClick={handleUndoInsightEdit}
              >
                Undo
              </Button>
            </div>
          )}
          {/* File Tabs */}
          <div className="flex items-center justify-between gap-1 px-4 py-2 bg-[#1e1e1e] border-b border-[#3b3b3b] overflow-x-auto">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-sm cursor-pointer transition-colors ${activeFileId === file.id
                    ? 'bg-[#1e1e1e] text-white border-t border-l border-r border-[#3b3b3b]'
                    : 'bg-[#2d2d2d] text-gray-400 hover:text-white hover:bg-[#3d3d3d]'
                    }`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', file.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const draggedId = e.dataTransfer.getData('text/plain')
                    handleMoveFile(draggedId, file.id)
                  }}
                  onClick={() => setActiveFileId(file.id)}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      e.preventDefault()
                      handleDeleteFile(file.id)
                    }
                  }}
                >
                  {file.type === 'cpp' ? (
                    <FileCode className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
                  <span>{file.name}</span>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file.id)
                      }}
                      className="ml-1 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setIsNewFileDialogOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New File</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <div className="group relative inline-flex">
                {/* Glow effect on hover - behind everything */}
                <span className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-purple-400/60 to-blue-400/60 -z-20 pointer-events-none"></span>

                {/* Gradient border wrapper - creates the border effect */}
                <span className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none"></span>
                <span className="absolute inset-[1px] rounded-md bg-transparent group-hover:bg-transparent -z-10 pointer-events-none"></span>

                <Button
                  variant="outline"
                  className={`bg-transparent border-white text-white hover:border-transparent transition-all duration-300 font-medium px-4 h-8 flex items-center gap-2 text-sm relative z-10 ${isInsightOpen ? 'bg-white/10 text-white' : ''}`}
                  onClick={() => setIsInsightOpen((prev) => !prev)}
                  aria-pressed={isInsightOpen}
                >
                  <Sparkles className="w-4 h-4" />
                  {/* Gradient text on hover */}
                  <span className="relative z-10 bg-gradient-to-r from-white to-white group-hover:from-purple-400 group-hover:to-blue-400 bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {isInsightOpen ? 'Close Insight' : 'AI Agent'}
                  </span>
                </Button>
              </div>
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10 font-medium px-4 h-8 flex items-center gap-2 text-sm"
              >
                <Bug className="w-4 h-4" />
                Debug
              </Button>
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
              <div
                className={`h-full overflow-hidden transition-all duration-500 relative ${isStreamingCode
                  ? 'after:absolute after:inset-0 after:z-50 after:pointer-events-none after:shadow-[inset_0_0_80px_rgba(168,85,247,0.15)] after:animate-pulse'
                  : ''
                  }`}
              >
                <Editor
                  height="100%"
                  language={activeFile?.type === 'cpp' ? 'cpp' : 'plaintext'}
                  theme={settings.theme}
                  defaultValue={activeFile?.content || ''}
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
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </ResizablePanel>

            {isTerminalOpen && (
              <>
                <ResizableHandle withHandle className="bg-[#3b3b3b] hover:bg-[#4b4b4b] transition-colors" />
                <ResizablePanel defaultSize={30} minSize={10}>
                  <div className="h-full flex flex-col bg-[#181818] border-t border-[#3b3b3b]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[#3b3b3b]">
                      <div className="text-sm font-semibold text-gray-300">Console</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          💡 Files created with ofstream are automatically displayed
                        </div>
                        <button
                          onClick={() => setIsTerminalOpen(false)}
                          className="p-1 hover:bg-[#2d2d2d] rounded transition-colors"
                          title="Close Terminal"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Split layout: Output (left) and Input (right) */}
                    <div className="flex-1 flex min-h-0">
                      {/* Left side - Output */}
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

                          {/* Interactive output or info message */}
                          {isInteractiveMode && interactiveOutput && (
                            <div className={`font-mono text-sm whitespace-pre-wrap ${compilerAvailable === false ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                              {interactiveOutput}
                            </div>
                          )}

                          {/* Standard output */}
                          {(!isInteractiveMode || compilerAvailable === false) && !loading && !error && output && (
                            <div className="space-y-2">
                              {output.compile_output && (
                                <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                                  <span className="font-semibold">Compilation Error:</span>
                                  {'\n'}
                                  {output.compile_output}
                                </div>
                              )}

                              {output.stderr && (
                                <div className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                                  <span className="font-semibold">Runtime Error:</span>
                                  {'\n'}
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

                          {!loading && !error && !output && !interactiveOutput && (
                            <div className="text-gray-500 text-sm italic">
                              Click "Run Code" to execute your program
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - Input */}
                      <div className="w-[480px] flex flex-col bg-[#1a1a1a]">
                        <div className="px-4 py-2 border-b border-[#3b3b3b] bg-[#1e1e1e]">
                          <div className="text-xs font-semibold text-gray-400">
                            Input (stdin):
                            {compilerAvailable === false && (
                              <span className="ml-2 text-yellow-400 text-xs">
                                (Judge0 - provide all inputs upfront)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col p-4 gap-3">
                          {/* Interactive Input Section - shown when waiting for input */}
                          {waitingForInput && (
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                              <label className="text-xs font-semibold text-yellow-400 mb-2 block">
                                ⏳ Program is waiting for input:
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  value={currentStdinInput}
                                  onChange={(e) => setCurrentStdinInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleSendStdin()
                                    }
                                  }}
                                  placeholder="Enter value and press Enter..."
                                  className="flex-1 bg-[#2d2d2d] border-[#3b3b3b] text-white text-sm font-mono focus:border-yellow-500"
                                  autoFocus
                                />
                                <Button
                                  onClick={handleSendStdin}
                                  disabled={!currentStdinInput.trim()}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4"
                                >
                                  Send
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Standard Input textarea */}
                          <div className="flex-1 flex flex-col">
                            <label className="text-xs text-gray-400 mb-2">
                              {waitingForInput
                                ? 'Pre-prepared inputs (for next run):'
                                : 'Enter program inputs (one per line):'}
                            </label>
                            <textarea
                              value={stdin}
                              onChange={(e) => setStdin(e.target.value)}
                              placeholder="Example:&#10;10&#10;20&#10;John&#10;3.14"
                              className="flex-1 px-3 py-2 bg-[#2d2d2d] border border-[#3b3b3b] rounded text-white text-sm font-mono resize-none focus:outline-none focus:border-green-600 placeholder-gray-500"
                              disabled={waitingForInput}
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

          {/* Collapsed Terminal Bar */}
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
      </div>

      {/* Mobile backdrop for Insight */}
      {isInsightOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsInsightOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Insight Sidebar */}
      <aside
        className={`fixed top-16 right-0 h-screen-minus-4rem w-full max-w-[420px] bg-[#181818] border-l border-[#3b3b3b] transition-transform duration-300 ease-in-out z-40 lg:z-auto ${isInsightOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        aria-hidden={!isInsightOpen}
      >
        <InsightIdeChat
          isOpen={isInsightOpen}
          onClose={() => setIsInsightOpen(false)}
          onInsertCode={handleInsertCodeFromInsight}
          onApplyCodeEdit={handleApplyCodeEdit}
          activeFileName={activeFile?.name}
          activeFileContent={activeFile?.content}
          activeFileLanguage={activeFile?.type === 'cpp' ? 'cpp' : 'plaintext'}
        />
      </aside>
      {/* New File Dialog */}
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent className="bg-[#1e1e1e] border-[#3b3b3b] text-white">
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new C++ or text file for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                placeholder="e.g., utils, input.txt"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFile()
                  }
                }}
                className="bg-[#2d2d2d] border-[#3b3b3b] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filetype">File Type</Label>
              <Select value={newFileType} onValueChange={(value: 'cpp' | 'txt') => setNewFileType(value)}>
                <SelectTrigger className="bg-[#2d2d2d] border-[#3b3b3b] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[350] bg-[#2d2d2d] border-[#3b3b3b] text-white">
                  <SelectItem value="cpp">C++ (.cpp)</SelectItem>
                  <SelectItem value="txt">Text (.txt)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewFileDialogOpen(false)
                setNewFileName('')
                setNewFileType('cpp')
              }}
              className="bg-transparent border-[#3b3b3b] text-white hover:bg-[#3d3d3d]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFile}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function IDEPage() {
  return (
    <Suspense fallback={
      <div className="h-screen-mobile bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading IDE...</div>
      </div>
    }>
      <IDEPageContent />
    </Suspense>
  )
}


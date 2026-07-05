export interface EmbeddedIdeCodeEditChange {
  type: "insert" | "delete" | "replace"
  line?: number
  start?: number
  end?: number
  content?: string
}

export interface EmbeddedIdeCodeEditResponse {
  type: "code_edit"
  target?: {
    file_name?: string
  }
  explanation?: string
  changes: EmbeddedIdeCodeEditChange[]
  full_content?: string
}

export interface EmbeddedIdeAgentBridge {
  activeFileName: string
  activeFileContent: string
  activeFileLanguage: string
  insertCode: (code: string) => void
  applyCodeEdit: (edit: EmbeddedIdeCodeEditResponse) => boolean
  acceptCodeChanges: () => void
  rejectCodeChanges: () => void
}

export function normalizeIdeNewlines(content: string): string {
  return content.replace(/\r\n/g, "\n")
}

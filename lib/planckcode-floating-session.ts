import type { FileItem } from "@/lib/types"

export const PLANCK_IDE_STATE_KEY = "planckcode-ide-state"
export const PLANCK_FLOATING_SESSION_KEY = "planckcode-floating-session"

export type PlanckIdeFloatingSource = "standalone" | "problem"

export type PlanckIdeFloatingSession = {
  returnPath: string
  source: PlanckIdeFloatingSource
  problemSlug?: string
  defaultLanguage: "cpp" | "python"
  files: FileItem[]
  activeFileId: string
  updatedAt: number
}

export type PlanckIdeWorkspaceSnapshot = {
  files: FileItem[]
  activeFileId: string
}

function isValidFileItem(value: unknown): value is FileItem {
  if (!value || typeof value !== "object") return false
  const file = value as Partial<FileItem>
  return (
    typeof file.id === "string" &&
    typeof file.name === "string" &&
    typeof file.content === "string" &&
    (file.type === "cpp" || file.type === "txt" || file.type === "python")
  )
}

export function sanitizeWorkspaceSnapshot(candidate: unknown): PlanckIdeWorkspaceSnapshot | null {
  if (!candidate || typeof candidate !== "object") return null
  const record = candidate as Partial<PlanckIdeWorkspaceSnapshot>
  if (!Array.isArray(record.files) || record.files.length === 0) return null
  if (!record.files.every(isValidFileItem)) return null
  if (typeof record.activeFileId !== "string") return null
  const activeExists = record.files.some((file) => file.id === record.activeFileId)
  return {
    files: record.files,
    activeFileId: activeExists ? record.activeFileId : record.files[0].id,
  }
}

export function readIdeWorkspaceFromStorage(): PlanckIdeWorkspaceSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(PLANCK_IDE_STATE_KEY)
    if (!raw) return null
    return sanitizeWorkspaceSnapshot(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeIdeWorkspaceToStorage(snapshot: PlanckIdeWorkspaceSnapshot) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PLANCK_IDE_STATE_KEY, JSON.stringify(snapshot))
  } catch (error) {
    console.warn("[PlanckIdeFloating] Failed to persist workspace", error)
  }
}

export function readFloatingSessionFromStorage(): PlanckIdeFloatingSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(PLANCK_FLOATING_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PlanckIdeFloatingSession>
    const workspace = sanitizeWorkspaceSnapshot({
      files: parsed.files,
      activeFileId: parsed.activeFileId,
    })
    if (
      !workspace ||
      typeof parsed.returnPath !== "string" ||
      (parsed.source !== "standalone" && parsed.source !== "problem") ||
      (parsed.defaultLanguage !== "cpp" && parsed.defaultLanguage !== "python")
    ) {
      return null
    }
    return {
      returnPath: parsed.returnPath,
      source: parsed.source,
      problemSlug: typeof parsed.problemSlug === "string" ? parsed.problemSlug : undefined,
      defaultLanguage: parsed.defaultLanguage,
      files: workspace.files,
      activeFileId: workspace.activeFileId,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function writeFloatingSessionToStorage(session: PlanckIdeFloatingSession | null) {
  if (typeof window === "undefined") return
  try {
    if (!session) {
      window.localStorage.removeItem(PLANCK_FLOATING_SESSION_KEY)
      return
    }
    window.localStorage.setItem(PLANCK_FLOATING_SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.warn("[PlanckIdeFloating] Failed to persist floating session", error)
  }
}

export function buildFloatingSession(input: {
  returnPath: string
  source: PlanckIdeFloatingSource
  problemSlug?: string
  defaultLanguage: "cpp" | "python"
  files: FileItem[]
  activeFileId: string
}): PlanckIdeFloatingSession {
  return {
    ...input,
    updatedAt: Date.now(),
  }
}

export function workspacesEqual(
  left: PlanckIdeWorkspaceSnapshot,
  right: PlanckIdeWorkspaceSnapshot,
): boolean {
  if (left.activeFileId !== right.activeFileId) return false
  if (left.files.length !== right.files.length) return false
  return left.files.every((file, index) => {
    const other = right.files[index]
    return (
      file.id === other.id &&
      file.name === other.name &&
      file.content === other.content &&
      file.type === other.type
    )
  })
}

export function floatingSessionsEqual(
  left: PlanckIdeFloatingSession,
  right: Omit<PlanckIdeFloatingSession, "updatedAt">,
): boolean {
  return (
    left.returnPath === right.returnPath &&
    left.source === right.source &&
    left.problemSlug === right.problemSlug &&
    left.defaultLanguage === right.defaultLanguage &&
    workspacesEqual(left, right)
  )
}

/** Navbar „Code” — deschide sesiunea floating (problemă sau IDE) pe fullscreen. */
export function getPlanckCodeNavHref(
  session: PlanckIdeFloatingSession | null | undefined,
  isFloatingVisible: boolean,
): string {
  if (isFloatingVisible && session) {
    return session.returnPath
  }
  return "/planckcode/ide"
}

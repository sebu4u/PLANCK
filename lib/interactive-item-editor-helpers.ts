let interactiveEditorUid = 0

export function nextInteractiveEditorId(prefix: string) {
  interactiveEditorUid += 1
  return `${prefix}_${Date.now()}_${interactiveEditorUid}`
}

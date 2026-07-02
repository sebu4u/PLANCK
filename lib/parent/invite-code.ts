const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateParentInviteCode(length = 8): string {
  let code = ""
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)
    code += INVITE_CODE_ALPHABET[index]
  }
  return code
}

export function normalizeParentInviteCode(code: string): string {
  return code.trim().toUpperCase()
}

export function buildParentConnectUrl(code: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "")
  return `${base}/connect-parent?code=${encodeURIComponent(normalizeParentInviteCode(code))}`
}

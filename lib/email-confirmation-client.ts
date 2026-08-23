export function fireSendConfirmationEmail(accessToken: string | undefined) {
  if (!accessToken) return
  void fetch("/api/auth/send-confirmation", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {})
}

export async function sendConfirmationEmailRequest(accessToken: string): Promise<{
  ok: boolean
  alreadyVerified?: boolean
  rateLimited?: boolean
  error?: string
}> {
  const response = await fetch("/api/auth/send-confirmation", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const payload = (await response.json().catch(() => null)) as {
    error?: string
    alreadyVerified?: boolean
    skipped?: string
  } | null

  if (response.status === 429 || payload?.skipped === "rate_limit") {
    return { ok: false, rateLimited: true, error: payload?.error }
  }
  if (!response.ok) {
    return { ok: false, error: payload?.error || "Nu am putut retrimite emailul." }
  }
  return { ok: true, alreadyVerified: payload?.alreadyVerified === true }
}

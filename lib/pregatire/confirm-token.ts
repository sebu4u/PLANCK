import { createHmac, timingSafeEqual } from "crypto"

/**
 * Mint a signed confirmation token for workshop attendance email links.
 * Format: userId:workshopId:signature
 * Signature: HMAC-SHA256(userId:workshopId) using WORKSHOP_CONFIRM_SECRET or CRON_SECRET fallback.
 */
export function mintConfirmToken(userId: string, workshopId: string): string {
  const secret = process.env.WORKSHOP_CONFIRM_SECRET || process.env.CRON_SECRET || ""
  if (!secret) {
    throw new Error("WORKSHOP_CONFIRM_SECRET or CRON_SECRET required to mint confirm token")
  }
  const signature = createHmac("sha256", secret)
    .update(`${userId}:${workshopId}`)
    .digest("hex")
  return `${userId}:${workshopId}:${signature}`
}

/**
 * Verify a workshop confirmation token.
 * Returns { valid: true, userId, workshopId } on success, or { valid: false, error } on failure.
 */
export function verifyConfirmToken(
  token: string,
  expectedWorkshopId: string,
): { valid: true; userId: string; workshopId: string } | { valid: false; error: string } {
  const parts = token.split(":")
  if (parts.length !== 3) {
    return { valid: false, error: "invalid_format" }
  }

  const [userId, workshopId, signature] = parts
  if (workshopId !== expectedWorkshopId) {
    return { valid: false, error: "workshop_mismatch" }
  }

  const secret = process.env.WORKSHOP_CONFIRM_SECRET || process.env.CRON_SECRET || ""
  if (!secret) {
    return { valid: false, error: "secret_not_configured" }
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${userId}:${workshopId}`)
    .digest("hex")

  const signatureBuffer = Buffer.from(signature, "hex")
  const expectedBuffer = Buffer.from(expectedSignature, "hex")

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: "invalid_signature" }
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, error: "invalid_signature" }
  }

  return { valid: true, userId, workshopId }
}

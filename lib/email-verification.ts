export const EMAIL_UNVERIFIED_CODE = "email_unverified"
export const EMAIL_CONFIRMATION_RATE_LIMIT_SECONDS = 60
export const MIN_SIGNUP_PASSWORD_LENGTH = 6

export const EMAIL_UNVERIFIED_CHECKOUT_MESSAGE =
  "Confirmă-ți emailul ca să poți plăti."
export const EMAIL_UNVERIFIED_PASSWORD_MESSAGE =
  "Confirmă-ți emailul ca să poți schimba parola."

export function isEmailVerified(profile: { email_verified?: boolean | null } | null | undefined): boolean {
  return profile?.email_verified !== false
}

export function isAlreadyRegisteredError(error: { message?: string; code?: string; status?: number } | null): boolean {
  if (!error) return false
  const message = (error.message ?? "").toLowerCase()
  const code = (error.code ?? "").toLowerCase()
  return (
    error.status === 422 ||
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already registered")
  )
}

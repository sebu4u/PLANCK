"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { MIN_SIGNUP_PASSWORD_LENGTH } from "@/lib/email-verification"

type OnboardingEmailSignupFormProps = {
  disabled?: boolean
  loading?: boolean
  onSubmit: (email: string, password: string) => void | Promise<void>
  inputClassName: string
  submitClassName: string
}

export function OnboardingEmailSignupForm({
  disabled = false,
  loading = false,
  onSubmit,
  inputClassName,
  submitClassName,
}: OnboardingEmailSignupFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError("Introdu un email valid.")
      return
    }
    if (password.length < MIN_SIGNUP_PASSWORD_LENGTH) {
      setError(`Parola trebuie să aibă cel puțin ${MIN_SIGNUP_PASSWORD_LENGTH} caractere.`)
      return
    }
    setError(null)
    await onSubmit(trimmedEmail, password)
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <Input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        disabled={disabled || loading}
        className={inputClassName}
      />
      <Input
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Parolă"
        disabled={disabled || loading}
        className={inputClassName}
      />
      {error ? <p className="text-center text-xs text-[#c2410c]">{error}</p> : null}
      <button type="submit" disabled={disabled || loading} className={submitClassName}>
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creăm contul...
          </span>
        ) : (
          "Creează cont"
        )}
      </button>
    </form>
  )
}

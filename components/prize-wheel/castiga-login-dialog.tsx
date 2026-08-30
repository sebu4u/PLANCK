"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, X } from "lucide-react"

import { LoginButton } from "@/components/LoginButton"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { CAMPAIGN_1LEU_SIGNUP_PATH } from "@/lib/onboarding"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

type CastigaLoginDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function authErrorMessage(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("invalid") || lower.includes("invalid logs")) {
    return "Email sau parolă incorecte."
  }
  return message
}

export function CastigaLoginDialog({ open, onOpenChange }: CastigaLoginDialogProps) {
  const { toast } = useToast()
  const emailRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPassword("")
      setShowPassword(false)
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Introdu un email valid.")
      return
    }
    if (!password) {
      setError("Introdu parola.")
      return
    }

    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      const message = authErrorMessage(signInError.message)
      setError(message)
      toast({
        title: "Eroare la autentificare",
        description: message,
        variant: "destructive",
      })
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        overlayClassName="z-[490] bg-black/40 backdrop-blur-[2px]"
        className={cn(
          "z-[500] gap-0 border-none bg-white p-0 shadow-[0_24px_60px_-24px_rgba(92,71,214,0.45)]",
          "w-[calc(100%-1.5rem)] max-w-[400px] rounded-[28px] sm:rounded-[28px]",
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          emailRef.current?.focus()
        }}
      >
        <div className="relative px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Închide"
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7C5CFC]">Planck Câștigă</p>
          <DialogTitle className="mt-1 pr-10 text-[1.45rem] font-black leading-tight tracking-tight text-gray-900">
            Intră în cont
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-500">
            Ai nevoie de un cont ca să învârți roata. Email și parolă, sau Google.
          </DialogDescription>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Email</span>
              <Input
                ref={emailRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nume@email.com"
                className="h-12 rounded-full border-gray-200 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#7C5CFC] md:text-base"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Parolă</span>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Parola ta"
                  className="h-12 rounded-full border-gray-200 bg-white px-4 pr-12 text-base text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#7C5CFC] md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-700"
                  aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-[15px] font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110 active:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se conectează...
                </span>
              ) : (
                "Intră în cont"
              )}
            </button>
          </form>

          <p className="mt-3 text-center text-sm text-gray-500">
            <Link href="/reset-password" className="font-semibold text-[#7C5CFC] hover:underline">
              Ți-ai uitat parola?
            </Link>
          </p>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#EBE8FF]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">sau</span>
            <div className="h-px flex-1 bg-[#EBE8FF]" />
          </div>

          <LoginButton
            className="border-[#EBE8FF] text-[15px] font-bold shadow-none"
            onError={(message) => {
              setError(message)
              toast({
                title: "Eroare la autentificare cu Google",
                description: message,
                variant: "destructive",
              })
            }}
          />

          <p className="mt-5 text-center text-sm text-gray-500">
            Nu ai cont?{" "}
            <Link href={CAMPAIGN_1LEU_SIGNUP_PATH} className="font-bold text-[#7C5CFC] hover:underline">
              Creează unul gratuit
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

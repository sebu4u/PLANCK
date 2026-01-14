"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rocket, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Google icon SVG component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

// Apple icon SVG component
const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
)

// Microsoft icon SVG component
const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" />
    <path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
)

function RegisterPageContent() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState<"google" | "github" | "microsoft" | "email" | null>(null)

  const [step, setStep] = useState<"email" | "password" | "confirmation">("email")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Referral state
  const [referralCode, setReferralCode] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithGoogle, loginWithGitHub, user } = useAuth()

  // Handle referral code from URL
  useEffect(() => {
    const refCode = searchParams.get("ref")
    if (refCode) {
      const code = refCode.toUpperCase()
      setReferralCode(code)
      // Save to localStorage so it persists through OAuth redirect
      localStorage.setItem("planck_referral_code", code)
    } else {
      // Check localStorage for referral code (in case user refreshed page)
      const storedCode = localStorage.getItem("planck_referral_code")
      if (storedCode) {
        setReferralCode(storedCode)
      }
    }
  }, [searchParams])

  // Process referral after successful registration
  useEffect(() => {
    const processReferral = async () => {
      if (!user || !referralCode) return

      const processedKey = `planck_referral_processed_${user.id}`
      if (sessionStorage.getItem(processedKey)) return

      try {
        const response = await fetch("/api/referral/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referral_code: referralCode,
            referred_user_id: user.id,
          }),
        })
        const data = await response.json()

        if (data.success) {
          sessionStorage.setItem(processedKey, "true")
          localStorage.removeItem("planck_referral_code")
        } else {
          if (data.error === "User already referred" || data.error === "Cannot refer yourself") {
            localStorage.removeItem("planck_referral_code")
          }
        }
      } catch (error) {
        console.error("Error processing referral:", error)
      }
    }

    processReferral()
  }, [user, referralCode])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prevent TopLoader from triggering since we remain on the same page
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast({
        title: "Eroare",
        description: "Te rugăm să introduci un email valid",
        variant: "destructive",
      })
      return
    }
    setStep("password")
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || password.length < 6) {
      toast({
        title: "Parolă invalidă",
        description: "Parola trebuie să aibă cel puțin 6 caractere.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Parolele nu coincid",
        description: "Te rugăm să verifici parola confirmată.",
        variant: "destructive",
      })
      return
    }

    setLoading("email")

    // Use Supabase client directly here or via a wrapper if you prefer
    // Importing locally to avoid circular dependencies if any, or just use the global import
    const { supabase } = await import("@/lib/supabaseClient")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // You can add metadata here if needed
        }
      }
    })

    if (error) {
      toast({
        title: "Eroare la înregistrare",
        description: error.message,
        variant: "destructive",
      })
      setLoading(null)
    } else {
      // If email confirmation is required, Supabase might not return a session immediately
      // Check if user is created but session is null => email confirmation needed
      if (data.user && !data.session) {
        setStep("confirmation")
      } else {
        // If auto-confirm is on or something, we might get a session. 
        // Usually for email/pass with confirm enabled, we go to confirmation screen.
        setStep("confirmation")
      }
      setLoading(null)
    }
  }

  const handleOAuthLogin = async (method: "google" | "github") => {
    setLoading(method)

    if (method === "google") {
      const { error } = await loginWithGoogle()
      if (error) {
        toast({
          title: "Eroare la autentificare cu Google",
          description: error.message,
          variant: "destructive",
        })
        setLoading(null)
        return
      }
    } else if (method === "github") {
      const { error } = await loginWithGitHub()
      if (error) {
        toast({
          title: "Eroare la autentificare cu GitHub",
          description: error.message,
          variant: "destructive",
        })
        setLoading(null)
        return
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header with Logo */}
      <header className="w-full px-6 py-6">
        <Link href="/" className="flex items-center gap-2 w-fit text-2xl font-bold text-black title-font">
          <Rocket className="w-6 h-6 text-black" />
          <span>PLANCK</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-[400px] flex flex-col items-center relative">

          {step === "password" && (
            <Alert className="absolute bottom-[calc(100%+0.5rem)] sm:bottom-[calc(100%+1.5rem)] p-3 sm:p-4 border-amber-200 bg-amber-50 text-amber-900 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 !text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold text-sm sm:text-base">Notă importantă</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs sm:text-sm">
                <span className="hidden sm:inline">Din cauza volumului mare de înscrieri, confirmarea prin email poate întârzia. Vă recomandăm autentificarea prin Google sau Apple pentru acces imediat.</span>
                <span className="sm:hidden">Confirmarea emailului poate întârzia. Recomandăm autentificarea cu Google/Apple.</span>
              </AlertDescription>
            </Alert>
          )}

          {step === "confirmation" ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-[32px] font-semibold text-black mb-4">
                Verifică-ți emailul
              </h1>
              <p className="text-gray-600 mb-8">
                Ți-am trimis un link de confirmare la adresa <strong>{email}</strong>. Te rugăm să verifici și spam-ul.
              </p>
              <div className="space-y-4">
                <Link href="/login">
                  <Button className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium text-base transition-colors">
                    Înapoi la Login
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => setStep("email")}
                  className="text-gray-500 hover:text-gray-900"
                >
                  Am greșit adresa de email
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Title */}
              <h1 className="text-[32px] font-semibold text-black mb-8 text-center animate-in slide-in-from-bottom-2 fade-in duration-300">
                {step === "email" ? "Create an account" : "Set password"}
              </h1>

              {step === "email" && (
                <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
                  {/* Email Form */}
                  <form onSubmit={handleEmailSubmit} className="w-full space-y-4 mb-4">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full h-12 px-4 border border-gray-300 rounded-full text-black placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 focus:outline-none bg-white transition-all"
                    />
                    <Button
                      type="submit"
                      className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium text-base transition-colors"
                    >
                      Continue
                    </Button>
                  </form>

                  {/* Login Link */}
                  <p className="text-sm text-center text-gray-600 mb-6">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-[#10a37f] hover:text-[#0d8c6d] font-medium transition-colors"
                    >
                      Log in
                    </Link>
                  </p>

                  {/* Divider */}
                  <div className="w-full flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-500 font-medium">OR</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="w-full space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("google")}
                      disabled={loading !== null}
                      className="w-full h-12 border border-gray-300 rounded-full bg-white hover:bg-gray-50 text-black font-medium text-base transition-colors flex items-center justify-center gap-3"
                    >
                      {loading === "google" ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      ) : (
                        <GoogleIcon />
                      )}
                      <span>Continue with Google</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading !== null}
                      className="w-full h-12 border border-gray-300 rounded-full bg-white hover:bg-gray-50 text-black font-medium text-base transition-colors flex items-center justify-center gap-3"
                    >
                      <AppleIcon />
                      <span>Continue with Apple</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading !== null}
                      className="w-full h-12 border border-gray-300 rounded-full bg-white hover:bg-gray-50 text-black font-medium text-base transition-colors flex items-center justify-center gap-3"
                    >
                      <MicrosoftIcon />
                      <span>Continue with Microsoft</span>
                    </Button>
                  </div>
                </div>
              )}

              {step === "password" && (
                <div className="w-full animate-in slide-in-from-right-8 fade-in duration-300">
                  <div className="mb-6">
                    <button
                      onClick={() => setStep("email")}
                      className="text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors mb-2"
                    >
                      ← Back
                    </button>
                    <div className="text-gray-500 text-sm">Signing up as <span className="text-black font-medium">{email}</span></div>
                  </div>

                  <form onSubmit={handleRegister} className="w-full space-y-4">
                    <div className="space-y-1">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full h-12 px-4 border border-gray-300 rounded-full text-black placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 focus:outline-none bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full h-12 px-4 border border-gray-300 rounded-full text-black placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 focus:outline-none bg-white"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading === "email"}
                      className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium text-base transition-colors mt-2"
                    >
                      {loading === "email" ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 flex justify-center">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/terms" className="text-gray-500 hover:text-gray-700 underline transition-colors">
            Terms of Use
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-700 underline transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}
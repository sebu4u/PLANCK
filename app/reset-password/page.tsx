"use client"

import React, { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, Rocket, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  // Verifică dacă suntem în modul de resetare (cu token)
  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')
    
    if (accessToken && refreshToken && type === 'recovery') {
      setIsResetMode(true)
      // Setează sesiunea cu token-urile
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [searchParams])

  // Redirect dacă userul e deja logat și nu e în modul de resetare
  useEffect(() => {
    if (!authLoading && user && !isResetMode) {
      router.replace("/")
    }
  }, [user, authLoading, router, isResetMode])

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    setLoading(false)
    
    if (error) {
      toast({
        title: "Eroare la trimiterea email-ului",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setEmailSent(true)
      toast({
        title: "Email trimis cu succes!",
        description: "Verifică inbox-ul și urmează link-ul pentru resetarea parolei.",
      })
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: "Parolele nu se potrivesc",
        description: "Asigură-te că ai introdus aceeași parolă în ambele câmpuri.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Parola prea scurtă",
        description: "Parola trebuie să aibă cel puțin 6 caractere.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    setLoading(false)
    
    if (error) {
      toast({
        title: "Eroare la resetarea parolei",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Parolă resetată cu succes!",
        description: "Te poți conecta acum cu noua parolă.",
      })
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 py-12 px-4">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
            <div
              className="absolute top-32 right-32 w-1.5 h-1.5 bg-purple-200 rounded-full opacity-50 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute bottom-40 left-40 w-1 h-1 bg-pink-200 rounded-full opacity-70 animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-60 right-60 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse"
              style={{ animationDelay: "3s" }}
            ></div>
            <div
              className="absolute bottom-20 right-20 w-1 h-1 bg-purple-300 rounded-full opacity-50 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>

          <div className="relative z-10 w-full max-w-md">
            <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl cosmic-glow animate-fade-in-up">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Rocket className="w-8 h-8 text-purple-600" />
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent title-font">
                    PLANCK
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-600">
                  {isResetMode 
                    ? "Setează o nouă parolă pentru contul tău"
                    : "Resetare parolă"
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!isResetMode ? (
                  // Formular pentru trimiterea email-ului de resetare
                  <>
                    {!emailSent ? (
                      <form onSubmit={handleSendResetEmail} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Adresa de email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="exemplu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                              required
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 h-12 text-lg font-semibold cosmic-glow"
                          disabled={loading}
                        >
                          {loading ? "Se trimite..." : "Trimite email de resetare"}
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Email trimis cu succes!
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Am trimis un link de resetare la adresa {email}. 
                            Verifică inbox-ul și urmează instrucțiunile.
                          </p>
                        </div>
                        <Button
                          onClick={() => setEmailSent(false)}
                          variant="outline"
                          className="w-full"
                        >
                          Trimite din nou
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  // Formular pentru setarea noii parole
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Noua parolă
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Introdu noua parolă"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        Confirmă noua parolă
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirmă noua parolă"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 h-12 text-lg font-semibold cosmic-glow"
                      disabled={loading}
                    >
                      {loading ? "Se resetează..." : "Resetează parola"}
                    </Button>
                  </form>
                )}

                {/* Back to Login Link */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Înapoi la login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

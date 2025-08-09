"use client"

import React from "react"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, Rocket, Star, Zap, ArrowRight, Github, Chrome } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()

  // Redirect dacă userul e deja logat
  React.useEffect(() => {
    if (!authLoading && user) {
      router.replace("/")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast({
        title: "Eroare la autentificare",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Autentificare reușită!",
        description: "Bine ai revenit!",
      })
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        {/* Main Login Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 py-12 px-4">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Moving stars */}
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

            {/* Floating particles */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full opacity-40 animate-float"></div>
            <div
              className="absolute top-40 right-20 w-3 h-3 bg-purple-200 rounded-full opacity-30 animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-pink-200 rounded-full opacity-50 animate-float"
              style={{ animationDelay: "4s" }}
            ></div>
            <div
              className="absolute top-60 right-1/3 w-2.5 h-2.5 bg-white rounded-full opacity-35 animate-float"
              style={{ animationDelay: "1s" }}
            ></div>

            {/* Gradient orbs */}
            <div
              className="absolute top-16 right-16 w-32 h-32 bg-gradient-to-br from-white/10 to-purple-300/20 rounded-full opacity-20 animate-pulse-scale"
              style={{ animationDelay: "3s" }}
            ></div>
            <div
              className="absolute bottom-20 left-16 w-24 h-24 bg-gradient-to-br from-pink-300/20 to-white/10 rounded-full opacity-25 animate-pulse-scale"
              style={{ animationDelay: "1.5s" }}
            ></div>
            <div
              className="absolute top-1/2 right-10 w-20 h-20 bg-gradient-to-br from-purple-200/10 to-pink-200/10 rounded-full opacity-30 animate-pulse-scale"
              style={{ animationDelay: "4s" }}
            ></div>

            {/* Geometric shapes */}
            <div
              className="absolute top-32 left-1/3 w-16 h-16 border border-white/20 rounded-lg opacity-20 rotate-12 animate-float"
              style={{ animationDelay: "2.5s" }}
            ></div>
            <div
              className="absolute bottom-40 right-1/4 w-12 h-12 border border-pink-200/30 rounded-full opacity-25 animate-float"
              style={{ animationDelay: "3.5s" }}
            ></div>

            {/* Light streaks */}
            <div
              className="absolute top-0 left-1/2 w-px h-20 bg-gradient-to-b from-white/20 to-transparent opacity-30 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute bottom-0 right-1/3 w-px h-16 bg-gradient-to-t from-pink-200/30 to-transparent opacity-25 animate-pulse"
              style={{ animationDelay: "2s" }}
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
                  Conectează-te la contul tău pentru a accesa cursurile și problemele premium
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
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

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Parola
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Introdu parola"
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

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                        Ține-mă conectat
                      </Label>
                    </div>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      Ai uitat parola?
                    </Link>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 h-12 text-lg font-semibold cosmic-glow"
                    disabled={loading}
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    {loading ? "Se conectează..." : "Conectează-te"}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <Separator className="bg-gray-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500">sau continuă cu</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 h-12 bg-transparent"
                  >
                    <Chrome className="w-5 h-5 mr-2" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 h-12 bg-transparent"
                  >
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </Button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-gray-600">
                    Nu ai cont încă?{" "}
                    <Link
                      href="/register"
                      className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                    >
                      Înregistrează-te aici
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center text-white animate-fade-in-up-delay">
              <div className="space-y-2">
                <Star className="w-6 h-6 mx-auto text-yellow-400" />
                <p className="text-sm font-medium">Cursuri Premium</p>
              </div>
              <div className="space-y-2">
                <Zap className="w-6 h-6 mx-auto text-yellow-400" />
                <p className="text-sm font-medium">Acces Nelimitat</p>
              </div>
              <div className="space-y-2">
                <Rocket className="w-6 h-6 mx-auto text-yellow-400" />
                <p className="text-sm font-medium">Progres Tracked</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

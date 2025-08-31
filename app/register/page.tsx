"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Rocket,
  Star,
  Zap,
  ArrowRight,
  Github,
  Chrome,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "",
    agreeToTerms: false,
  })
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Parolele nu coincid",
        description: "Te rugăm să verifici parolele introduse.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        data: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          nickname: formData.nickname,
          grade: formData.grade,
        },
      },
    })
    if (error) {
      setLoading(false)
      toast({
        title: "Eroare la înregistrare",
        description: error.message,
        variant: "destructive",
      })
      return
    }
    setLoading(false)
    toast({
      title: "Cont creat cu succes!",
      description: "Verifică emailul pentru confirmare.",
    })
    router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
  }

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        {/* Main Register Section */}
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

            {/* Gradient orbs */}
            <div
              className="absolute top-16 right-16 w-32 h-32 bg-gradient-to-br from-white/10 to-purple-300/20 rounded-full opacity-20 animate-pulse-scale"
              style={{ animationDelay: "3s" }}
            ></div>
            <div
              className="absolute bottom-20 left-16 w-24 h-24 bg-gradient-to-br from-pink-300/20 to-white/10 rounded-full opacity-25 animate-pulse-scale"
              style={{ animationDelay: "1.5s" }}
            ></div>
          </div>

          <div className="relative z-10 w-full max-w-lg">
            <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl cosmic-glow animate-fade-in-up">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Rocket className="w-8 h-8 text-purple-600" />
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent title-font">
                    PLANCK
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-600">
                  Creează-ți contul și începe călătoria în lumea fizicii
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        Prenume
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Prenume"
                          value={formData.firstName}
                          onChange={(e) => updateFormData("firstName", e.target.value)}
                          className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Nume
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Nume"
                        value={formData.lastName}
                        onChange={(e) => updateFormData("lastName", e.target.value)}
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                        required
                      />
                    </div>
                  </div>

                  {/* Nickname Field */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">
                      Nickname
                    </Label>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="Alege un nickname"
                      value={formData.nickname}
                      onChange={(e) => updateFormData("nickname", e.target.value)}
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                      required
                    />
                  </div>

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
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                        required
                      />
                    </div>
                  </div>

                  {/* Grade Field */}
                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                      Clasa
                    </Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        id="grade"
                        value={formData.grade}
                        onChange={(e) => updateFormData("grade", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-md focus:border-purple-400 focus:ring-purple-400 h-12 bg-white"
                        required
                      >
                        <option value="">Selectează clasa</option>
                        <option value="9">Clasa a IX-a</option>
                        <option value="10">Clasa a X-a</option>
                        <option value="11">Clasa a XI-a</option>
                        <option value="12">Clasa a XII-a</option>
                        <option value="other">Altă clasă</option>
                      </select>
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Parola
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Creează o parolă"
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
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
                        Confirmă parola
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirmă parola"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
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
                  </div>

                  {/* Terms */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => updateFormData("agreeToTerms", checked as boolean)}
                        className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 mt-1"
                        required
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                        Sunt de acord cu{" "}
                        <Link href="/termeni" className="text-purple-600 hover:text-purple-700 font-medium">
                          Termenii și Condițiile
                        </Link>{" "}
                        și{" "}
                        <Link href="/termeni" className="text-purple-600 hover:text-purple-700 font-medium">
                          Politica de Confidențialitate
                        </Link>
                      </Label>
                    </div>
                  </div>

                  {/* Register Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 h-12 text-lg font-semibold cosmic-glow"
                    disabled={loading}
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    {loading ? "Se creează..." : "Creează cont"}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <Separator className="bg-gray-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500">sau înregistrează-te cu</span>
                  </div>
                </div>

                {/* Social Register */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 h-12 bg-transparent"
                    onClick={async () => {
                      await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined },
                      })
                    }}
                  >
                    <Chrome className="w-5 h-5 mr-2" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 h-12 bg-transparent"
                    onClick={async () => {
                      await supabase.auth.signInWithOAuth({
                        provider: "github",
                        options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined },
                      })
                    }}
                  >
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </Button>
                </div>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-gray-600">
                    Ai deja cont?{" "}
                    <Link
                      href="/login"
                      className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                    >
                      Conectează-te aici
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

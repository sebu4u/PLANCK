"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { Lock, Chrome, Github, ArrowLeft, Brain } from 'lucide-react'

export default function InsightUnauthorizedPage() {
  const router = useRouter()
  const { loginWithGoogle, loginWithGitHub } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState<"google" | "github" | null>(null)

  const handleGoogleLogin = async () => {
    setLoading("google")
    const { error } = await loginWithGoogle()
    if (error) {
      toast({
        title: "Eroare la autentificare cu Google",
        description: error.message,
        variant: "destructive",
      })
      setLoading(null)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading("github")
    const { error } = await loginWithGitHub()
    if (error) {
      toast({
        title: "Eroare la autentificare cu GitHub",
        description: error.message,
        variant: "destructive",
      })
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
        <div className="w-full max-w-md">
          <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="relative">
                  <Lock className="w-8 h-8 text-purple-500" />
                  <Brain className="w-4 h-4 text-purple-400 absolute -bottom-1 -right-1" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Autentificare necesară
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400 text-base">
                Ai nevoie de cont pentru a folosi Insight AI
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Explanation */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2">
                <h3 className="text-white font-semibold text-sm">Ce poți face cu Insight?</h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Întreabă orice despre fizică</li>
                  <li>• Rezolvă probleme pas cu pas</li>
                  <li>• Primește explicații personalizate</li>
                  <li>• Învață la propriul tău ritm</li>
                </ul>
              </div>

              {/* Login Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading !== null}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  {loading === "google" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                      Se conectează...
                    </>
                  ) : (
                    <>
                      <Chrome className="w-5 h-5 mr-2 text-blue-600" />
                      Continuă cu Google
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGitHubLogin}
                  disabled={loading !== null}
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white border-2 border-gray-900 hover:border-gray-800 transition-all duration-200"
                >
                  {loading === "github" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Se conectează...
                    </>
                  ) : (
                    <>
                      <Github className="w-5 h-5 mr-2" />
                      Continuă cu GitHub
                    </>
                  )}
                </Button>
              </div>

              {/* Back Button */}
              <div className="pt-4 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="w-full text-gray-400 hover:text-white hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Înapoi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Înregistrarea este gratuită și durează doar câteva secunde
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}


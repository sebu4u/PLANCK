"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { Mail, RefreshCw, ArrowRight } from "lucide-react"

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const router = useRouter()
  const email = params.get("email") || "adresa ta de email"
  const { toast } = useToast()
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    if (!params.get("email")) {
      toast({ title: "Email lipsă", description: "Reîncearcă înregistrarea.", variant: "destructive" })
      return
    }
    setResending(true)
    const { error } = await supabase.auth.resend({ type: "signup", email: params.get("email") as string, options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined } })
    setResending(false)
    if (error) {
      toast({ title: "Nu s-a putut retrimite emailul", description: error.message, variant: "destructive" })
      return
    }
    toast({ title: "Email retrimis", description: "Verifică din nou inbox-ul și folderul Spam." })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 py-12 px-4">
          <div className="relative z-10 w-full max-w-lg">
            <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl cosmic-glow">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Mail className="w-8 h-8 text-purple-600" />
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent title-font">
                    Verifică-ți emailul
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-600">
                  Ți-am trimis un link de confirmare la {email}.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-gray-700 text-center">
                  Deschide emailul și apasă pe link-ul de confirmare pentru a-ți activa contul. După confirmare te vom redirecționa către pagina de autentificare.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <Button className="flex-1 min-w-0 whitespace-normal break-words text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 h-12 text-lg font-semibold" onClick={() => router.push("/login")}> 
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Am confirmat, mergi la login
                  </Button>
                  <Button variant="outline" className="flex-1 min-w-0 whitespace-normal break-words text-center border-gray-300 hover:border-gray-400 hover:bg-gray-50 h-12" onClick={handleResend} disabled={resending}>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    {resending ? "Se retrimite..." : "Retrimite emailul"}
                  </Button>
                </div>

                <Separator className="bg-gray-200" />
                <p className="text-sm text-gray-500 text-center">
                  Nu găsești emailul? Verifică folderul Spam sau folosește butonul de mai sus pentru a retrimite emailul.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}



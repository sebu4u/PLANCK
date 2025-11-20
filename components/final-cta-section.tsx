"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { isValidEmail, subscribeToNewsletter } from "@/lib/newsletter"
import { useAnalytics } from "@/lib/analytics"

export default function FinalCTASection() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const analytics = useAnalytics()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Eroare",
        description: "Te rugăm să introduci o adresă de email",
        variant: "destructive",
      })
      return
    }

    if (!isValidEmail(email)) {
      toast({
        title: "Email invalid",
        description: "Te rugăm să introduci o adresă de email validă",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await subscribeToNewsletter(email)
      toast({
        title: "Abonare reușită! 🎉",
        description: result.message,
      })
      analytics.trackNewsletterSignup()
      setEmail("")
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      const errorMessage = error instanceof Error ? error.message : "A apărut o eroare. Te rugăm să încerci din nou."
      toast({
        title: "Eroare la abonare",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative w-full bg-black overflow-hidden py-24 sm:py-32 lg:py-40">
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        {/* Main CTA Title */}
        <div className="mb-8">
          <h2 className="scroll-animate-fade-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Gata să transformi
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              modul în care înveți?
            </span>
          </h2>
          <p className="scroll-animate-fade-up animate-delay-200 text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Alătură-te mii de elevi care deja folosesc PLANCK pentru a-și îmbunătăți rezultatele la fizică și informatică.
          </p>
        </div>

        {/* CTA Section with Email Input and Button */}
        <div className="scroll-animate-fade-up animate-delay-400 flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
          {/* Email Input with Send Icon */}
          <form onSubmit={handleSubmit} className="relative flex-1 w-full sm:w-auto">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Input
              type="email"
              placeholder="Introdu email-ul tău"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 pr-12 h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400 rounded-lg text-base"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* CTA Button */}
          <Link href="/cursuri" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-200 transition-all duration-300 text-lg px-8 h-11 w-full sm:w-auto"
            >
              Începe acum
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


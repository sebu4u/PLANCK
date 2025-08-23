"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Mail, Send, Sparkles, Zap, Star } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setEmail("")
    // Here you would typically send the email to your newsletter service
  }

  return (
    <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-16 h-16 border border-purple-300/30 rounded-lg rotate-45 animate-float opacity-40"></div>
        <div className="absolute top-40 right-32 w-12 h-12 border border-pink-300/40 rounded-full animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 border border-indigo-300/30 rounded-lg -rotate-12 animate-float" style={{ animationDelay: "4s" }}></div>
        <div className="absolute bottom-20 right-1/4 w-8 h-8 border border-purple-400/50 rounded-full animate-float" style={{ animationDelay: "1s" }}></div>
        
        {/* Moving particles */}
        <div className="absolute top-10 left-1/3 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-60 right-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full opacity-50 animate-pulse" style={{ animationDelay: "1.5s" }}></div>
        <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-pink-300 rounded-full opacity-70 animate-pulse" style={{ animationDelay: "3s" }}></div>
        <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-indigo-300 rounded-full opacity-40 animate-pulse" style={{ animationDelay: "2.5s" }}></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-16 right-16 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-pulse-scale" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-16 left-16 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-pulse-scale" style={{ animationDelay: "4s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-gradient-to-br from-pink-400/15 to-indigo-400/15 rounded-full animate-pulse-scale" style={{ animationDelay: "1s" }}></div>
        
        {/* Orbiting elements */}
        <div className="absolute top-1/4 left-1/4 w-20 h-20">
          <div className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-orbit" style={{ animationDuration: "12s" }}></div>
        </div>
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16">
          <div className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-orbit" style={{ animationDuration: "18s", animationDelay: "3s" }}></div>
        </div>
        
        {/* Light streaks */}
        <div className="absolute top-0 left-1/2 w-px h-24 bg-gradient-to-b from-purple-300 to-transparent opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-0 right-1/3 w-px h-20 bg-gradient-to-t from-pink-300 to-transparent opacity-25 animate-pulse" style={{ animationDelay: "2.5s" }}></div>
        <div className="absolute top-1/3 left-0 h-px w-16 bg-gradient-to-r from-transparent to-indigo-300 opacity-20 animate-pulse" style={{ animationDelay: "4s" }}></div>
        
        {/* Hexagonal shapes */}
        <div className="absolute top-40 left-1/2 w-10 h-10 border border-purple-300/30 opacity-30 animate-float" style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          animationDelay: "2s",
        }}></div>
        <div className="absolute bottom-1/3 right-1/2 w-8 h-8 border border-pink-300/40 opacity-35 animate-float" style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          animationDelay: "5s",
        }}></div>
        
        {/* Connecting lines */}
        <div className="absolute top-1/2 left-1/4 w-20 h-px bg-gradient-to-r from-purple-300/30 to-pink-300/30 opacity-20 animate-pulse" style={{ animationDelay: "3.5s" }}></div>
        <div className="absolute top-3/4 right-1/3 w-16 h-px bg-gradient-to-r from-pink-300/30 to-indigo-300/30 opacity-25 animate-pulse" style={{ animationDelay: "6s" }}></div>
        
        {/* Glowing dots */}
        <div className="absolute top-1/3 left-1/5 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse" style={{
          boxShadow: "0 0 12px rgba(147, 51, 234, 0.6)",
          animationDelay: "1.2s",
        }}></div>
        <div className="absolute bottom-1/3 right-1/5 w-3 h-3 bg-pink-400 rounded-full opacity-40 animate-pulse" style={{
          boxShadow: "0 0 12px rgba(236, 72, 153, 0.6)",
          animationDelay: "3.8s",
        }}></div>
        <div className="absolute top-2/3 left-1/2 w-2.5 h-2.5 bg-indigo-400 rounded-full opacity-40 animate-pulse" style={{
          boxShadow: "0 0 10px rgba(99, 102, 241, 0.6)",
          animationDelay: "2.8s",
        }}></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto text-center z-10">
        {/* Header with animated icons */}
        <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in-up">
          <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white title-font leading-tight cosmic-text-glow">
            Newsletter PLANCK
          </h2>
          <Zap className="w-8 h-8 text-yellow-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>
        
        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-purple-200 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up-delay">
          Concepte explicate simplu, probleme rezolvate și resurse pentru note mai mari.
        </p>
        
        {/* Newsletter form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 cosmic-glow animate-fade-in-up-delay" style={{ animationDelay: "0.3s" }}>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Introdu email-ul tău"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white/90 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 cosmic-glow shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Se abonează...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Abonează-te
                </>
              )}
            </Button>
          </form>
          
          {/* Additional info */}
          <p className="text-purple-200 text-sm mt-4 opacity-80">
            📧 Primește conținut exclusiv în fiecare săptămână
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="flex items-center justify-center gap-2 mt-8 animate-fade-in-up-delay" style={{ animationDelay: "0.6s" }}>
          <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="text-purple-200 text-sm">Fără spam, doar conținut de calitate</span>
          <Star className="w-4 h-4 text-yellow-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>
      </div>
    </section>
  )
}

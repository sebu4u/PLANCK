"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Rocket,
  ArrowRight,
  ArrowLeft,
  Github,
  Chrome,
  GraduationCap,
  Users,
  Sparkles,
  Star,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { gsap } from "gsap"
import { motion } from "framer-motion"

// Confetti component for celebration
const Confetti = () => {
  const confettiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (confettiRef.current) {
      const confetti = confettiRef.current
      const colors = ['#9333ea', '#dc2626', '#f59e0b', '#10b981', '#3b82f6']
      
      for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div')
        piece.style.position = 'absolute'
        piece.style.width = '8px'
        piece.style.height = '8px'
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
        piece.style.left = Math.random() * 100 + '%'
        piece.style.top = '-10px'
        piece.style.borderRadius = '50%'
        confetti.appendChild(piece)

        gsap.to(piece, {
          y: window.innerHeight + 100,
          x: (Math.random() - 0.5) * 200,
          rotation: Math.random() * 360,
          duration: 3 + Math.random() * 2,
          ease: "power2.out",
          delay: Math.random() * 0.5,
          onComplete: () => {
            if (piece.parentNode) {
              piece.parentNode.removeChild(piece)
            }
          }
        })
      }
    }
  }, [])

  return <div ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" />
}

type UserType = "student" | "teacher" | null
type CardType = 
  | "role-selection" 
  | "role-confirmation" 
  | "class-selection" 
  | "class-message" 
  | "username" 
  | "auth-method" 
  | "welcome"

export default function RegisterPage() {
  const [userType, setUserType] = useState<UserType>("student")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [selectedClass, setSelectedClass] = useState("9")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState<"google" | "github" | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [containerPadding, setContainerPadding] = useState({ left: 32, right: 32 })
  const [mounted, setMounted] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const { loginWithGoogle, loginWithGitHub } = useAuth()

  // Refs for carousel
  const carouselContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Generate stable star positions only on client (matching pricing page)
  const stars = useMemo(() => {
    if (!mounted) return []
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000
    return Array.from({ length: 20 }, (_, i) => {
      // Use a seeded random based on index for consistency
      const seed = i * 0.618033988749895 // Golden ratio for better distribution
      const random = (seed: number) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }
      
      return {
        id: i,
        x: random(seed) * width,
        y: random(seed + 1) * 400,
        opacity: random(seed + 2) * 0.5 + 0.3,
        scale: random(seed + 3) * 0.5 + 0.5,
        width: random(seed + 4) * 2 + 1,
        height: random(seed + 5) * 2 + 1,
        animateY: random(seed + 6) * -20,
        animateOpacity: random(seed + 7) * 0.3 + 0.2,
        duration: random(seed + 8) * 5 + 5,
      }
    })
  }, [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Class selection messages
  const classMessages = {
    "9": "Super! Elevii de clasa a 9-a care folosesc Planck învață mai rapid noțiunile de bază 🚀",
    "10": "Genial! În clasa a 10-a, elevii Planck își dublează încrederea la fizică 💡",
    "11": "Wow! Elevii de clasa a 11-a care au folosit Planck au rezultate excelente la olimpiadă 🏆",
    "12": "Impresionant! În clasa a 12-a, Planck e un aliat pentru BAC și admitere 🎓",
    "other": "Bun venit! Chiar dacă nu ești licean, Planck te poate ajuta să îți crești nivelul la fizică 🔬"
  }

  // Generate card list based on user type
  const cardList = useMemo<CardType[]>(() => {
    if (!userType) {
      return ["role-selection"]
    }
    if (userType === "student") {
      const cards: CardType[] = ["role-selection", "role-confirmation", "class-selection"]
      if (selectedClass) {
        cards.push("class-message")
      }
      cards.push("username")
      // Always include auth-method card for preloading
      cards.push("auth-method")
      if (showConfetti) {
        cards.push("welcome")
      }
      return cards
    } else {
      const cards: CardType[] = ["role-selection", "role-confirmation", "username"]
      // Always include auth-method card for preloading
      cards.push("auth-method")
      if (showConfetti) {
        cards.push("welcome")
      }
      return cards
    }
  }, [userType, selectedClass, showConfetti])

  // Get responsive card width
  const getCardWidth = () => {
    if (typeof window === 'undefined') return 480
    const width = window.innerWidth
    if (width < 640) return 320
    if (width < 768) return 400
    return 480
  }

  // Get responsive gap
  const getGap = () => {
    if (typeof window === 'undefined') return 24
    const width = window.innerWidth
    if (width < 640) return 12
    if (width < 768) return 16
    return 24
  }

  // Get responsive padding - calculated to center first card
  const getPadding = () => {
    if (typeof window === 'undefined') return 32
    const cardWidth = getCardWidth()
    const viewportWidth = window.innerWidth
    // Center the first card: padding should be (viewportWidth - cardWidth) / 2
    // This ensures the first card is centered when scrollPosition = 0
    const calculatedPadding = (viewportWidth - cardWidth) / 2
    // Only use minimum padding if card is larger than viewport (shouldn't happen in practice)
    // Otherwise, use calculated padding to center the card
    return Math.max(0, calculatedPadding)
  }

  // Update container padding when window resizes or card changes
  useEffect(() => {
    const updatePadding = () => {
      const padding = getPadding()
      setContainerPadding({ left: padding, right: padding })
    }
    
    // Initial update
    updatePadding()
    
    // Update on resize
    window.addEventListener('resize', updatePadding)
    
    return () => window.removeEventListener('resize', updatePadding)
  }, []) // Only run on mount and resize, not on card change

  // Scroll to center current card
  const scrollToCard = (index: number) => {
    const card = cardRefs.current[index]
    const container = carouselContainerRef.current
    if (card && container) {
      const containerRect = container.getBoundingClientRect()
      const cardWidth = getCardWidth()
      const gap = getGap()
      const padding = getPadding()
      
      // For the first card, it should be centered with scroll = 0
      // The padding should already center it, so scroll should be 0
      if (index === 0) {
        container.scrollTo({
          left: 0,
          behavior: 'smooth'
        })
        return
      }
      
      // Calculate position of card's left edge within the flex container (includes padding)
      const cardLeftEdge = padding + index * (cardWidth + gap)
      
      // Calculate container center position (viewport center)
      const containerCenter = containerRect.width / 2
      
      // To center the card: card center should be at container center
      // Card center = cardLeftEdge + (cardWidth / 2)
      // We need: card center = container scrollLeft + containerCenter
      // So: scrollLeft = card center - containerCenter
      // scrollLeft = (cardLeftEdge + cardWidth / 2) - containerCenter
      const scrollPosition = cardLeftEdge + (cardWidth / 2) - containerCenter
      
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }
  }

  // Navigate to next card
  const goToNext = () => {
    if (currentCardIndex < cardList.length - 1) {
      const newIndex = currentCardIndex + 1
      setCurrentCardIndex(newIndex)
      scrollToCard(newIndex)
    }
  }

  // Navigate to previous card
  const goToPrevious = () => {
    if (currentCardIndex > 0) {
      const newIndex = currentCardIndex - 1
      setCurrentCardIndex(newIndex)
      scrollToCard(newIndex)
    }
  }

  // Handle role selection
  const handleRoleSelect = (type: "student" | "teacher") => {
    // Reset selections when changing user type
    if (type !== userType) {
      if (type === "student") {
        setSelectedClass("9") // Set default class for students
      } else {
        setSelectedClass("") // Clear class for teachers
      }
      setUsername("")
      setShowConfetti(false)
    }
    setUserType(type)
    setTimeout(() => {
      setCurrentCardIndex(1) // Move to role confirmation
      setTimeout(() => scrollToCard(1), 100)
    }, 100)
  }

  // Handle continue after role confirmation
  const handleRoleConfirmContinue = () => {
    if (userType === "student") {
      const newIndex = 2 // Move to class selection
      setCurrentCardIndex(newIndex)
      setTimeout(() => scrollToCard(newIndex), 100)
    } else {
      const newIndex = 2 // Move to username
      setCurrentCardIndex(newIndex)
      setTimeout(() => scrollToCard(newIndex), 100)
    }
  }

  // Handle class selection
  const handleClassSelect = (grade: string) => {
    setSelectedClass(grade)
    setTimeout(() => {
      const newIndex = 3 // Move to class message
      setCurrentCardIndex(newIndex)
      setTimeout(() => scrollToCard(newIndex), 100)
    }, 100)
  }

  // Handle continue after class message
  const handleClassMessageContinue = () => {
    const newIndex = 4 // Move to username
    setCurrentCardIndex(newIndex)
    setTimeout(() => scrollToCard(newIndex), 100)
  }

  // Handle username submit
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast({
        title: "Eroare",
        description: "Te rugăm să introduci un nume de utilizator",
        variant: "destructive",
      })
      return
    }
    const usernameIndex = userType === "student" ? 4 : 2
    const newIndex = usernameIndex + 1 // Move to auth method
    setCurrentCardIndex(newIndex)
    setTimeout(() => scrollToCard(newIndex), 100)
  }

  // Handle OAuth login
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
    
    // Show welcome and confetti
    setShowConfetti(true)
    setLoading(null)
    // Wait for card list to update with welcome card, then scroll to it
    setTimeout(() => {
      // After showConfetti updates, welcome card will be at the end
      // Calculate expected index: current cards + welcome = total length
      const expectedLength = cardList.length + 1
      setCurrentCardIndex(expectedLength - 1)
    }, 100)
  }

  // Update card list when dependencies change and adjust index
  useEffect(() => {
    // Ensure current index is valid
    if (currentCardIndex >= cardList.length && cardList.length > 0) {
      setCurrentCardIndex(cardList.length - 1)
    }
  }, [cardList.length, currentCardIndex])

  // Initial scroll to center first card and handle scroll updates
  useEffect(() => {
    if (carouselContainerRef.current) {
      // Wait a bit for padding to be calculated and applied
      const scrollTimeout = setTimeout(() => {
        scrollToCard(currentCardIndex)
      }, 150)
      return () => clearTimeout(scrollTimeout)
    }
  }, [currentCardIndex, cardList.length, containerPadding])

  // Render individual card content
  const renderCardContent = (cardType: CardType, index: number) => {
    const isActive = index === currentCardIndex

    switch (cardType) {
      case "role-selection":
        return (
          <div className="h-full flex flex-col">
            <div className="text-center space-y-3 sm:space-y-4 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Bine ai venit pe Planck! 👋
              </h2>
              <p className="text-base sm:text-lg text-gray-400">
                Hai să începem. Ești elev sau profesor?
              </p>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                <Button
                  onClick={() => handleRoleSelect("student")}
                  className="h-24 sm:h-28 md:h-32 bg-[#141414] border border-gray-600/30 hover:border-gray-500/50 hover:bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col items-center justify-center gap-2 sm:gap-3 group hover:scale-105"
                >
                  <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm sm:text-base md:text-lg font-semibold">Sunt elev</span>
                </Button>
                <Button
                  onClick={() => handleRoleSelect("teacher")}
                  className="h-24 sm:h-28 md:h-32 bg-[#141414] border border-gray-600/30 hover:border-gray-500/50 hover:bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col items-center justify-center gap-2 sm:gap-3 group hover:scale-105"
                >
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm sm:text-base md:text-lg font-semibold">Sunt profesor</span>
                </Button>
              </div>
            </div>
            <div className="text-center pt-3 sm:pt-4 border-t border-white/10 flex-shrink-0 mt-auto">
              <p className="text-sm sm:text-base text-gray-400">
                Ai deja cont?{" "}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openLoginModal'))
                  }}
                  className="text-white hover:text-gray-300 font-semibold transition-colors underline"
                >
                  Conectează-te aici
                </button>
              </p>
            </div>
          </div>
        )

      case "role-confirmation":
        return userType === "student" ? (
          <div className="text-center space-y-4 sm:space-y-6 h-full flex flex-col justify-center px-2">
            <div className="space-y-3 sm:space-y-4">
              <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white mx-auto" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Bine ai venit, elev! 🎓
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed px-2">
                Îți oferim un călăuză personalizat pentru a învăța fizică și informatică într-un mod interactiv și distractiv!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Înapoi
                </Button>
              )}
              <Button
                onClick={handleRoleConfirmContinue}
                className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
              >
                Continuă
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
        </div>
          </div>
        ) : (
          <div className="text-center space-y-4 sm:space-y-6 h-full flex flex-col justify-center px-2">
            <div className="space-y-3 sm:space-y-4">
              <Users className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white mx-auto" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Salut, profesor! 👨‍🏫
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed px-2">
                În curând vei beneficia de funcții exclusive pentru profesori! Pentru moment, poți crea contul tău și explora platforma.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Înapoi
                </Button>
              )}
              <Button
                onClick={handleRoleConfirmContinue}
                className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
              >
                Continuă
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
                </div>
        )

      case "class-selection":
        return (
          <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
            <div className="text-center flex-shrink-0 px-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Selectează clasa ta
                        </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Alege clasa pentru a primi conținut personalizat
                        </p>
                      </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow">
                          {[
                            { value: "9", label: "Clasa 9" },
                            { value: "10", label: "Clasa 10" },
                            { value: "11", label: "Clasa 11" },
                            { value: "12", label: "Clasa 12" },
                { value: "other", label: "Altă clasă", colSpan: "col-span-2" }
              ].map((option) => (
                            <Button
                              key={option.value}
                              variant={selectedClass === option.value ? "default" : "outline"}
                              onClick={() => handleClassSelect(option.value)}
                              className={`h-12 sm:h-14 text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 ${
                                selectedClass === option.value
                      ? "bg-white text-[#0d1117] border-0 hover:bg-gray-200 hover:scale-105"
                      : "bg-white text-[#0d1117] border-white/20 hover:bg-gray-200 hover:border-white/40 hover:scale-105"
                              } ${option.colSpan || ""}`}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
            <div className="flex justify-center flex-shrink-0 px-4">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Înapoi
                </Button>
              )}
            </div>
          </div>
        )

      case "class-message":
        return (
          <div className="text-center space-y-4 sm:space-y-6 h-full flex flex-col justify-center px-2">
            <div className="space-y-3 sm:space-y-4">
              <Sparkles className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white mx-auto" />
              <p className="text-gray-200 font-semibold text-base sm:text-lg md:text-xl leading-relaxed px-2">
                {classMessages[selectedClass as keyof typeof classMessages]}
              </p>
                  </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Înapoi
                </Button>
              )}
              <Button
                onClick={handleClassMessageContinue}
                className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
              >
                Continuă
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
          </div>
        )

      case "username":
        return (
          <div className="space-y-4 sm:space-y-6 h-full flex flex-col justify-center px-2">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Creează numele tău de utilizator
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Alege un nume unic care te reprezintă
              </p>
            </div>
            <form onSubmit={handleUsernameSubmit} className="space-y-4 px-2">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm sm:text-base text-gray-300">
                  Nume de utilizator
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: ionel_2024"
                  className="bg-[#0d1117] border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 focus:ring-white/20 h-11 sm:h-12 text-sm sm:text-base"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {index > 0 && (
                  <Button
                    type="button"
                    onClick={goToPrevious}
                    className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Înapoi
                  </Button>
                )}
                        <Button
                  type="submit"
                  className={`bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 text-base sm:text-lg font-semibold hover:scale-105 ${index > 0 ? 'w-full sm:flex-1' : 'w-full'}`}
                >
                          Continuă
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </Button>
                  </div>
            </form>
          </div>
        )

      case "auth-method":
        return (
          <div className="space-y-4 sm:space-y-6 h-full flex flex-col justify-center px-2">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                            Creează-ți contul
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                            Alege cum vrei să te înregistrezi
              </p>
            </div>
                          <div className="space-y-3 sm:space-y-4 px-2">
                            <Button
                              variant="outline"
                              onClick={() => handleOAuthLogin("google")}
                className="w-full h-12 sm:h-14 border-white/20 bg-[#0d1117] text-white hover:bg-gray-800 hover:border-white/40 transition-all duration-300 text-base sm:text-lg font-semibold hover:scale-105"
                              disabled={loading !== null}
                            >
                              {loading === "google" ? (
                                <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                  <span className="text-sm sm:text-base">Se conectează...</span>
                                </>
                              ) : (
                                <>
                                  <Chrome className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Continuă cu Google
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleOAuthLogin("github")}
                className="w-full h-12 sm:h-14 border-white/20 bg-[#0d1117] text-white hover:bg-gray-800 hover:border-white/40 transition-all duration-300 text-base sm:text-lg font-semibold hover:scale-105"
                              disabled={loading !== null}
                            >
                              {loading === "github" ? (
                                <>
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                  <span className="text-sm sm:text-base">Se conectează...</span>
                                </>
                              ) : (
                                <>
                                  <Github className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Continuă cu GitHub
                                </>
                              )}
                            </Button>
                          </div>
            <div className="flex justify-center px-4">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Înapoi
                </Button>
                    )}
                  </div>
          </div>
        )

      case "welcome":
        return (
          <div className="text-center space-y-4 sm:space-y-6 h-full flex flex-col justify-center px-2">
            <div className="space-y-3 sm:space-y-4">
              <Star className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-yellow-400 mx-auto animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {userType === "student" 
                  ? "Bun venit în comunitatea Planck! 🎉"
                  : "Bun venit, profesor! 🎉"
                }
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed px-2">
                {userType === "student"
                  ? "Contul tău a fost creat cu succes! Ești pregătit să începi aventura ta de învățare."
                  : "Contul tău a fost creat cu succes! În curând vei primi acces la funcțiile exclusive pentru profesori."
                }
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold hover:scale-105 mx-4 sm:mx-auto w-auto"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Mergi la Dashboard
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#101113] text-white overflow-hidden flex flex-col font-sans selection:bg-blue-500/30">
      <Navigation />
      
      {showConfetti && <Confetti />}

      {/* Top Glow Effect (matching pricing page) */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-white/10 blur-[120px] rounded-[100%] pointer-events-none z-0" />
      
      {/* Stars Background (matching pricing page) */}
      <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none z-0 opacity-60">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute bg-white rounded-full"
            initial={{
              x: star.x,
              y: star.y,
              opacity: star.opacity,
              scale: star.scale,
            }}
            animate={{
              y: [null, star.animateY],
              opacity: [null, star.animateOpacity],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
            }}
          />
        ))}
      </div>

      {/* Main Register Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden pt-12 sm:pt-16 z-10">

        {/* Gradient fades on sides - outside carousel to avoid z-index issues (hidden on mobile) */}
        <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-16 sm:w-32 md:w-64 bg-gradient-to-r from-[#101113] via-[#101113]/80 to-transparent z-20 pointer-events-none"></div>
        <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-16 sm:w-32 md:w-64 bg-gradient-to-l from-[#101113] via-[#101113]/80 to-transparent z-20 pointer-events-none"></div>

        {/* Carousel Container */}
        <div 
          ref={carouselContainerRef}
          className="relative w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Cards Container */}
          <div 
            className="flex items-center h-full gap-3 sm:gap-4 md:gap-6" 
            style={{ 
              minWidth: 'fit-content',
              paddingLeft: `${containerPadding.left}px`,
              paddingRight: `${containerPadding.right}px`,
            }}
          >
            {cardList.map((cardType, index) => {
              const isCurrentCard = index === currentCardIndex
              const isAdjacent = Math.abs(index - currentCardIndex) === 1
              const isLeftCard = index < currentCardIndex
              const isRightCard = index > currentCardIndex
              const distance = Math.abs(index - currentCardIndex)
              
              return (
                <div
                  key={`${cardType}-${index}`}
                  ref={(el) => { 
                    if (el) {
                      cardRefs.current[index] = el
                    }
                  }}
                  className="flex-shrink-0 snap-center transition-all duration-500 ease-out relative w-[320px] sm:w-[400px] md:w-[480px] h-[500px] sm:h-[550px] md:h-[600px]"
                  style={{ 
                    transform: isCurrentCard ? 'scale(1)' : isAdjacent ? 'scale(0.85)' : 'scale(0.8)',
                    pointerEvents: isCurrentCard ? 'auto' : 'none',
                    willChange: 'transform, opacity',
                  }}
                >
                  <Card 
                    className="w-full h-full bg-[#151619]/60 border-white/10 backdrop-blur-sm rounded-2xl shadow-2xl relative overflow-hidden hover:bg-[#1A1B1E]/80 hover:border-white/20 transition-all duration-300"
                    style={{
                      filter: isCurrentCard ? 'none' : 'grayscale(100%)',
                      opacity: isCurrentCard ? 1 : isAdjacent ? 0.5 : 0.3,
                      transition: 'filter 500ms ease-out, opacity 500ms ease-out, background-color 300ms ease-out, border-color 300ms ease-out',
                    }}
                  >
                    {/* Dark overlay for non-current cards - simulates blur by hiding content */}
                    {!isCurrentCard && (
                      <div 
                        className="absolute inset-0 z-30 pointer-events-none"
                        style={{
                          backgroundColor: isAdjacent 
                            ? 'rgba(16, 17, 19, 0.6)' 
                            : 'rgba(16, 17, 19, 0.8)',
                        }}
                      />
                    )}
                    {/* Gradient overlay for adjacent cards */}
                    {isAdjacent && !isCurrentCard && (
                      <div 
                        className="absolute inset-0 z-30 pointer-events-none"
                        style={{
                          background: isLeftCard
                            ? 'linear-gradient(to right, rgba(16, 17, 19, 0.95) 0%, rgba(16, 17, 19, 0.7) 30%, rgba(16, 17, 19, 0.3) 60%, transparent 100%)'
                            : 'linear-gradient(to left, rgba(16, 17, 19, 0.95) 0%, rgba(16, 17, 19, 0.7) 30%, rgba(16, 17, 19, 0.3) 60%, transparent 100%)'
                        }}
                      />
                    )}
                    <CardHeader className="text-center pb-4 sm:pb-6 relative z-10 px-4 sm:px-6">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                        <Rocket className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                        <CardTitle className="text-2xl sm:text-2xl md:text-3xl font-bold text-white">
                          PLANCK
                        </CardTitle>
                </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 h-[calc(100%-100px)] sm:h-[calc(100%-120px)] overflow-y-auto scrollbar-hide relative z-10">
                      {renderCardContent(cardType, index)}
              </CardContent>
            </Card>
              </div>
              )
            })}
            </div>
          </div>
        </section>
    </div>
  )
}
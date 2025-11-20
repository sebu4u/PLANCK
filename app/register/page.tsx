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

  const { toast } = useToast()
  const router = useRouter()
  const { loginWithGoogle, loginWithGitHub } = useAuth()

  // Refs for carousel
  const carouselContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

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

  // Scroll to center current card
  const scrollToCard = (index: number) => {
    const card = cardRefs.current[index]
    const container = carouselContainerRef.current
    if (card && container) {
      const containerRect = container.getBoundingClientRect()
      const cardWidth = 480
      const gap = 24
      
      // Calculate padding from the container's padding-left
      const paddingLeft = (window.innerWidth - cardWidth) / 2
      
      // Calculate position of card within the flex container (includes padding)
      const cardPosition = paddingLeft + index * (cardWidth + gap)
      
      // Calculate container center position (viewport center)
      const containerCenter = containerRect.width / 2
      
      // Calculate scroll position needed to center the card
      // Card's left edge position - viewport center + card half width = centered
      const scrollPosition = cardPosition - containerCenter + (cardWidth / 2)
      
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
      const scrollTimeout = setTimeout(() => {
        scrollToCard(currentCardIndex)
      }, 100)
      return () => clearTimeout(scrollTimeout)
    }
  }, [currentCardIndex, cardList.length])

  // Render individual card content
  const renderCardContent = (cardType: CardType, index: number) => {
    const isActive = index === currentCardIndex

    switch (cardType) {
      case "role-selection":
        return (
          <div className="h-full flex flex-col">
            <div className="text-center space-y-4 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                Bine ai venit pe Planck! 👋
              </h2>
              <p className="text-lg text-gray-400">
                Hai să începem. Ești elev sau profesor?
              </p>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button
                  onClick={() => handleRoleSelect("student")}
                  className="h-32 bg-[#141414] border border-gray-600/30 hover:border-gray-500/50 hover:bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col items-center justify-center gap-3 group hover:scale-105"
                >
                  <GraduationCap className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-lg font-semibold">Sunt elev</span>
                </Button>
                <Button
                  onClick={() => handleRoleSelect("teacher")}
                  className="h-32 bg-[#141414] border border-gray-600/30 hover:border-gray-500/50 hover:bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col items-center justify-center gap-3 group hover:scale-105"
                >
                  <Users className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-lg font-semibold">Sunt profesor</span>
                </Button>
              </div>
            </div>
            <div className="text-center pt-4 border-t border-white/10 flex-shrink-0 mt-auto">
              <p className="text-gray-400">
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
          <div className="text-center space-y-6 h-full flex flex-col justify-center">
            <div className="space-y-4">
              <GraduationCap className="w-16 h-16 text-white mx-auto" />
              <h2 className="text-2xl font-bold text-white">
                Bine ai venit, elev! 🎓
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Îți oferim un călăuză personalizat pentru a învăța fizică și informatică într-un mod interactiv și distractiv!
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Înapoi
                </Button>
              )}
              <Button
                onClick={handleRoleConfirmContinue}
                className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
              >
                Continuă
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
        </div>
          </div>
        ) : (
          <div className="text-center space-y-6 h-full flex flex-col justify-center">
            <div className="space-y-4">
              <Users className="w-16 h-16 text-white mx-auto" />
              <h2 className="text-2xl font-bold text-white">
                Salut, profesor! 👨‍🏫
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                În curând vei beneficia de funcții exclusive pentru profesori! Pentru moment, poți crea contul tău și explora platforma.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Înapoi
                </Button>
              )}
              <Button
                onClick={handleRoleConfirmContinue}
                className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
              >
                Continuă
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
                </div>
        )

      case "class-selection":
        return (
          <div className="space-y-6 h-full flex flex-col">
            <div className="text-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-white mb-2">
                Selectează clasa ta
                        </h2>
              <p className="text-gray-400">
                Alege clasa pentru a primi conținut personalizat
                        </p>
                      </div>
            <div className="grid grid-cols-2 gap-4 flex-grow">
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
                              className={`h-14 text-lg font-semibold transition-all duration-300 ${
                                selectedClass === option.value
                      ? "bg-white text-[#0d1117] border-0 hover:bg-gray-200 hover:scale-105"
                      : "bg-white text-[#0d1117] border-white/20 hover:bg-gray-200 hover:border-white/40 hover:scale-105"
                              } ${option.colSpan || ""}`}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
            <div className="flex gap-4 justify-center flex-shrink-0">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Înapoi
                </Button>
              )}
            </div>
          </div>
        )

      case "class-message":
        return (
          <div className="text-center space-y-6 h-full flex flex-col justify-center">
            <div className="space-y-4">
              <Sparkles className="w-16 h-16 text-white mx-auto" />
              <p className="text-gray-200 font-semibold text-xl leading-relaxed">
                {classMessages[selectedClass as keyof typeof classMessages]}
              </p>
                  </div>
            <div className="flex gap-4 justify-center">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Înapoi
                </Button>
              )}
              <Button
                onClick={handleClassMessageContinue}
                className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
              >
                Continuă
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )

      case "username":
        return (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Creează numele tău de utilizator
              </h2>
              <p className="text-gray-400">
                Alege un nume unic care te reprezintă
              </p>
            </div>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">
                  Nume de utilizator
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: ionel_2024"
                  className="bg-[#0d1117] border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 focus:ring-white/20"
                  required
                />
              </div>
              <div className="flex gap-4">
                {index > 0 && (
                  <Button
                    type="button"
                    onClick={goToPrevious}
                    className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 text-lg font-semibold hover:scale-105 flex-1"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Înapoi
                  </Button>
                )}
                        <Button
                  type="submit"
                  className={`bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 text-lg font-semibold hover:scale-105 ${index > 0 ? 'flex-1' : 'w-full'}`}
                >
                          Continuă
                  <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                  </div>
            </form>
          </div>
        )

      case "auth-method":
        return (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">
                            Creează-ți contul
              </h2>
              <p className="text-gray-400">
                            Alege cum vrei să te înregistrezi
              </p>
            </div>
                          <div className="space-y-4">
                            <Button
                              variant="outline"
                              onClick={() => handleOAuthLogin("google")}
                className="w-full h-14 border-white/20 bg-[#0d1117] text-white hover:bg-gray-800 hover:border-white/40 transition-all duration-300 text-lg font-semibold hover:scale-105"
                              disabled={loading !== null}
                            >
                              {loading === "google" ? (
                                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                  Se conectează...
                                </>
                              ) : (
                                <>
                                  <Chrome className="w-5 h-5 mr-2" />
                                  Continuă cu Google
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleOAuthLogin("github")}
                className="w-full h-14 border-white/20 bg-[#0d1117] text-white hover:bg-gray-800 hover:border-white/40 transition-all duration-300 text-lg font-semibold hover:scale-105"
                              disabled={loading !== null}
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
            <div className="flex justify-center">
              {index > 0 && (
                <Button
                  onClick={goToPrevious}
                  className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Înapoi
                </Button>
                    )}
                  </div>
          </div>
        )

      case "welcome":
        return (
          <div className="text-center space-y-6 h-full flex flex-col justify-center">
            <div className="space-y-4">
              <Star className="w-16 h-16 text-yellow-400 mx-auto animate-pulse" />
              <h2 className="text-2xl font-bold text-white">
                {userType === "student" 
                  ? "Bun venit în comunitatea Planck! 🎉"
                  : "Bun venit, profesor! 🎉"
                }
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                {userType === "student"
                  ? "Contul tău a fost creat cu succes! Ești pregătit să începi aventura ta de învățare."
                  : "Contul tău a fost creat cu succes! În curând vei primi acces la funcțiile exclusive pentru profesori."
                }
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-[#0d1117] hover:bg-gray-200 transition-all duration-300 h-12 px-8 text-lg font-semibold hover:scale-105"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Mergi la Dashboard
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-screen bg-[#0d1117] text-white overflow-hidden flex flex-col">
      <Navigation />
      
      {showConfetti && <Confetti />}

      {/* Main Register Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#0d1117] pt-16">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Moving stars */}
          <div className="absolute top-10 left-20 w-1 h-1 bg-gray-400 rounded-full opacity-40 animate-pulse"></div>
          <div
            className="absolute top-32 right-32 w-1.5 h-1.5 bg-gray-400 rounded-full opacity-30 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 left-40 w-1 h-1 bg-gray-400 rounded-full opacity-40 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-60 right-60 w-1.5 h-1.5 bg-gray-400 rounded-full opacity-25 animate-pulse"
            style={{ animationDelay: "3s" }}
          ></div>

          {/* Floating particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-gray-400 rounded-full opacity-20 animate-float"></div>
          <div
            className="absolute top-40 right-20 w-3 h-3 bg-gray-400 rounded-full opacity-15 animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-gray-400 rounded-full opacity-25 animate-float"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        {/* Gradient fades on sides - outside carousel to avoid z-index issues */}
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-r from-[#0d1117] via-[#0d1117]/80 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-[#0d1117] via-[#0d1117]/80 to-transparent z-20 pointer-events-none"></div>

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
          <div className="flex items-center h-full gap-6" style={{ 
            minWidth: 'fit-content',
            paddingLeft: 'max(32px, calc(50vw - 240px))',
            paddingRight: 'max(32px, calc(50vw - 240px))'
          }}>
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
                  className="flex-shrink-0 snap-center transition-all duration-500 ease-out relative"
                  style={{ 
                    width: '480px', 
                    height: '600px',
                    transform: isCurrentCard ? 'scale(1)' : isAdjacent ? 'scale(0.85)' : 'scale(0.8)',
                    pointerEvents: isCurrentCard ? 'auto' : 'none',
                    willChange: 'transform, opacity',
                  }}
                >
                  <Card 
                    className="w-full h-full bg-[#1a1a1a] border-white/10 shadow-2xl relative overflow-hidden"
                    style={{
                      filter: isCurrentCard ? 'none' : 'grayscale(100%)',
                      opacity: isCurrentCard ? 1 : isAdjacent ? 0.5 : 0.3,
                      transition: 'filter 500ms ease-out, opacity 500ms ease-out',
                    }}
                  >
                    {/* Dark overlay for non-current cards - simulates blur by hiding content */}
                    {!isCurrentCard && (
                      <div 
                        className="absolute inset-0 z-30 pointer-events-none"
                        style={{
                          backgroundColor: isAdjacent 
                            ? 'rgba(13, 17, 23, 0.6)' 
                            : 'rgba(13, 17, 23, 0.8)',
                        }}
                      />
                    )}
                    {/* Gradient overlay for adjacent cards */}
                    {isAdjacent && !isCurrentCard && (
                      <div 
                        className="absolute inset-0 z-30 pointer-events-none"
                        style={{
                          background: isLeftCard
                            ? 'linear-gradient(to right, rgba(13, 17, 23, 0.95) 0%, rgba(13, 17, 23, 0.7) 30%, rgba(13, 17, 23, 0.3) 60%, transparent 100%)'
                            : 'linear-gradient(to left, rgba(13, 17, 23, 0.95) 0%, rgba(13, 17, 23, 0.7) 30%, rgba(13, 17, 23, 0.3) 60%, transparent 100%)'
                        }}
                      />
                    )}
                    <CardHeader className="text-center pb-6 relative z-10">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <Rocket className="w-8 h-8 text-white" />
                        <CardTitle className="text-3xl font-bold text-white">
                          PLANCK
                        </CardTitle>
                </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 h-[calc(100%-120px)] overflow-y-auto scrollbar-hide relative z-10">
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
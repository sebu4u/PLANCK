"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  CheckCircle,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
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
            // Clean up the element after animation
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

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedClass, setSelectedClass] = useState("")
  const [showClassSelection, setShowClassSelection] = useState(true)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [showAuthOptions, setShowAuthOptions] = useState(false)
  const [authMethod, setAuthMethod] = useState<"email" | "google" | "github" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const { loginWithGoogle } = useAuth()

  // Refs for GSAP animations
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressBarRef = useRef<HTMLDivElement>(null)
  const welcomeTextRef = useRef<HTMLDivElement>(null)
  const classSelectRef = useRef<HTMLDivElement>(null)
  const encouragementRef = useRef<HTMLDivElement>(null)
  const encouragementWordsRef = useRef<(HTMLSpanElement | null)[]>([])
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  const authOptionsCardRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const mainCardRef = useRef<HTMLDivElement>(null)

  // Class selection messages
  const classMessages = {
    "9": "Super! Elevii de clasa a 9-a care folosesc Planck învață mai rapid noțiunile de bază 🚀",
    "10": "Genial! În clasa a 10-a, elevii Planck își dublează încrederea la fizică 💡",
    "11": "Wow! Elevii de clasa a 11-a care au folosit Planck au rezultate excelente la olimpiadă 🏆",
    "12": "Impresionant! În clasa a 12-a, Planck e un aliat pentru BAC și admitere 🎓",
    "other": "Bun venit! Chiar dacă nu ești licean, Planck te poate ajuta să îți crești nivelul la fizică 🔬"
  }

  // GSAP animations
  useEffect(() => {
    // Animate main card entrance
    if (mainCardRef.current) {
      gsap.fromTo(mainCardRef.current,
        { 
          opacity: 0, 
          y: 50, 
          scale: 0.9,
          rotationX: -10
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotationX: 0,
          duration: 1, 
          ease: "back.out(1.7)" 
        }
      )
    }

    if (currentStep === 1) {
      // Animate welcome text
      if (welcomeTextRef.current) {
        gsap.fromTo(welcomeTextRef.current, 
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.3 }
        )
      }
      
      // Animate class selection
      if (classSelectRef.current) {
        gsap.fromTo(classSelectRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)", delay: 0.5 }
        )
      }
    }
  }, [currentStep])

  useEffect(() => {
    // Update progress bar
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${(currentStep / 3) * 100}%`,
        duration: 0.5,
        ease: "power2.out"
      })
    }
  }, [currentStep])

  const handleClassSelect = (grade: string) => {
    setSelectedClass(grade)
    
    // Animate main card transition
    if (mainCardRef.current) {
      gsap.to(mainCardRef.current, {
        scale: 0.95,
        rotationX: 5,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          // Hide class selection and show encouragement
          if (classSelectRef.current) {
            gsap.to(classSelectRef.current, {
              opacity: 0,
              y: -20,
              duration: 0.4,
              ease: "power2.in",
              onComplete: () => {
                setShowClassSelection(false)
                setShowEncouragement(true)
                
                // Animate main card back to normal
                if (mainCardRef.current) {
                  gsap.to(mainCardRef.current, {
                    scale: 1,
                    rotationX: 0,
                    duration: 0.4,
                    ease: "back.out(1.7)"
                  })
                }
                
                // Animate encouragement segment in
                if (encouragementRef.current) {
                  gsap.fromTo(encouragementRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
                  )
                }
                
                // Animate each word individually with stagger
                setTimeout(() => {
                  const words = encouragementWordsRef.current.filter(Boolean)
                  if (words.length > 0) {
                    gsap.fromTo(words, 
                      { 
                        opacity: 0, 
                        y: 20, 
                        scale: 0.8,
                        rotationX: -90
                      },
                      { 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        rotationX: 0,
                        duration: 0.6, 
                        ease: "back.out(1.7)",
                        stagger: 0.1,
                        delay: 0.2
                      }
                    )
                  }
                  
                  // Animate continue button after words with bounce effect
                  setTimeout(() => {
                    if (continueButtonRef.current) {
                      gsap.fromTo(continueButtonRef.current,
                        { 
                          opacity: 0, 
                          y: 30, 
                          scale: 0.7
                        },
                        { 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          duration: 0.8, 
                          ease: "back.out(2)",
                          onComplete: () => {
                            // Add a subtle pulse effect after the bounce
                            if (continueButtonRef.current) {
                              gsap.to(continueButtonRef.current, {
                                scale: 1.05,
                                duration: 0.3,
                                yoyo: true,
                                repeat: 1,
                                ease: "power2.inOut"
                              })
                            }
                          }
                        }
                      )
                    }
                  }, 1000) // Wait for words animation to complete
                }, 300)
              }
            })
          }
        }
      })
    }
  }

  const handleContinueToAuth = () => {
    // Animate main card transition
    if (mainCardRef.current) {
      gsap.to(mainCardRef.current, {
        scale: 0.95,
        rotationX: -5,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          // Hide encouragement card and show auth options card
          if (encouragementRef.current) {
            gsap.to(encouragementRef.current, {
              opacity: 0,
              y: -20,
              duration: 0.4,
              ease: "power2.in",
              onComplete: () => {
                setShowEncouragement(false)
                setShowAuthOptions(true)
                
                // Animate main card back to normal
                if (mainCardRef.current) {
                  gsap.to(mainCardRef.current, {
                    scale: 1,
                    rotationX: 0,
                    duration: 0.4,
                    ease: "back.out(1.7)"
                  })
                }
                
                // Animate auth options card in with enhanced effects
                if (authOptionsCardRef.current) {
                  gsap.fromTo(authOptionsCardRef.current,
                    { 
                      opacity: 0, 
                      y: 40, 
                      scale: 0.8,
                      rotationX: -15
                    },
                    { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      rotationX: 0,
                      duration: 1, 
                      ease: "back.out(1.7)"
                    }
                  )
                }
              }
            })
          }
        }
      })
    }
  }

  const handleAuthMethodSelect = (method: "email" | "google" | "github") => {
    setAuthMethod(method)
    
    if (method === "email") {
      // Simple transition to step 2
      if (stepRefs.current[0]) {
        gsap.to(stepRefs.current[0], {
          opacity: 0,
          x: -30,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            setCurrentStep(2)
            
            if (stepRefs.current[1]) {
              gsap.fromTo(stepRefs.current[1],
                { 
                  opacity: 0, 
                  x: 30
                },
                { 
                  opacity: 1, 
                  x: 0,
                  duration: 0.4, 
                  ease: "power2.out" 
                }
              )
            }
          }
        })
      }
    } else {
      // Handle OAuth directly - no success message
      handleOAuthLogin(method)
    }
  }

  const handleOAuthLogin = async (method: "google" | "github") => {
    setLoading(true)
    
    if (method === "google") {
      const { error } = await loginWithGoogle()
      if (error) {
        toast({
          title: "Eroare la autentificare cu Google",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }
    } else if (method === "github") {
      // Add GitHub login logic here when available
      toast({
        title: "GitHub login",
        description: "Funcționalitatea GitHub va fi disponibilă în curând!",
        variant: "default",
      })
      setLoading(false)
      return
    }
    
    // For OAuth, redirect directly without success message
    setLoading(false)
    // OAuth will handle redirect automatically
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate username length
    if (formData.username.length > 13) {
      toast({
        title: "Username prea lung",
        description: "Username-ul trebuie să aibă maxim 13 caractere.",
        variant: "destructive",
      })
      return
    }
    
    // Validate passwords match
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
          name: formData.username,
          nickname: formData.username,
          grade: selectedClass,
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
    
    // Simple transition to success step
    if (stepRefs.current[1]) {
      gsap.to(stepRefs.current[1], {
        opacity: 0,
        x: -30,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentStep(3)
          setShowConfetti(true)
          
          if (successRef.current) {
            gsap.fromTo(successRef.current,
              { 
                opacity: 0, 
                x: 30
              },
              { 
                opacity: 1, 
                x: 0,
                duration: 0.4, 
                ease: "power2.out" 
              }
            )
          }
        }
      })
    }
  }

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      
      {showConfetti && <Confetti />}

      <div className="pt-16">
        {/* Progress Bar */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Pasul {currentStep} din 3</span>
              <span>{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                ref={progressBarRef}
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: "0%" }}
              />
            </div>
          </div>
        </div>

        {/* Main Register Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 py-12 px-4 pt-32">
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
            <Card ref={mainCardRef} className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl cosmic-glow" style={{ opacity: 0 }}>
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Rocket className="w-8 h-8 text-purple-600" />
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent title-font">
                    PLANCK
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Step 1: Welcome + Class Selection + Auth Options */}
                {currentStep === 1 && (
                  <div ref={el => { stepRefs.current[0] = el }} className="space-y-6">
                    {/* Welcome Message - Only show when no class selected */}
                    {!selectedClass && (
                      <div ref={welcomeTextRef} className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                          Bine ai venit pe Planck! 👋
                        </h2>
                        <p className="text-lg text-gray-600">
                          Hai să începem.
                        </p>
                      </div>
                    )}

                    {/* Class Selection */}
                    {showClassSelection && (
                      <div ref={classSelectRef} className="space-y-6">
                        <Label className="text-2xl font-bold text-gray-800 block text-center">
                          Selectează clasa ta:
                      </Label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { value: "9", label: "Clasa 9" },
                            { value: "10", label: "Clasa 10" },
                            { value: "11", label: "Clasa 11" },
                            { value: "12", label: "Clasa 12" },
                            { value: "other", label: "Alta clasa", colSpan: "col-span-2" }
                          ].map((option, index) => (
                            <Button
                              key={option.value}
                              variant={selectedClass === option.value ? "default" : "outline"}
                              onClick={() => handleClassSelect(option.value)}
                              className={`h-14 text-lg font-semibold transition-all duration-300 ${
                                selectedClass === option.value
                                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                                  : "border-purple-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50"
                              } ${option.colSpan || ""}`}
                              style={{ 
                                opacity: 0, 
                                transform: 'translateY(20px) scale(0.9)' 
                              }}
                              ref={(el) => {
                                if (el) {
                                  gsap.fromTo(el, 
                                    { opacity: 0, y: 20, scale: 0.9 },
                                    { 
                                      opacity: 1, 
                                      y: 0, 
                                      scale: 1, 
                                      duration: 0.5, 
                                      ease: "back.out(1.7)",
                                      delay: 0.5 + (index * 0.1)
                                    }
                                  )
                                }
                              }}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                  </div>
                    )}

                    {/* Encouragement Message - Simple Inline Segment */}
                    {showEncouragement && (
                      <div ref={encouragementRef} className="text-center space-y-6">
                        <p className="text-gray-800 font-bold text-xl leading-relaxed">
                          {classMessages[selectedClass as keyof typeof classMessages]
                            .split(' ')
                            .map((word, index) => (
                              <span
                                key={index}
                                  ref={el => { encouragementWordsRef.current[index] = el }}
                                className="inline-block mr-2"
                                style={{ opacity: 0 }}
                              >
                                {word}
                              </span>
                            ))
                          }
                        </p>
                        <Button
                          ref={continueButtonRef}
                          onClick={handleContinueToAuth}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 h-12 px-8 text-lg font-semibold cosmic-glow"
                          style={{ opacity: 0 }}
                        >
                          <ArrowRight className="w-5 h-5 mr-2" />
                          Continuă
                        </Button>
                  </div>
                    )}

                    {/* Auth Options Card */}
                    {showAuthOptions && (
                      <Card ref={authOptionsCardRef} className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl cosmic-glow">
                        <CardHeader className="text-center pb-6">
                          <CardTitle className="text-2xl font-bold text-gray-800">
                            Creează-ți contul
                          </CardTitle>
                          <CardDescription className="text-lg text-gray-600">
                            Alege cum vrei să te înregistrezi
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Email Input */}
                          <div className="space-y-3">
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

                            <Button
                              onClick={() => handleAuthMethodSelect("email")}
                              disabled={!formData.email}
                              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ArrowRight className="w-5 h-5 mr-2" />
                              Continuă cu email ✉️
                            </Button>
                          </div>

                          {/* Divider */}
                    <div className="relative">
                            <Separator className="bg-gray-200" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-white px-4 text-sm text-gray-500">sau</span>
                            </div>
                          </div>

                          {/* OAuth Options */}
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              onClick={() => handleAuthMethodSelect("google")}
                              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 h-12"
                              disabled={loading}
                            >
                              <Chrome className="w-5 h-5 mr-2" />
                              Google
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleAuthMethodSelect("github")}
                              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 h-12"
                              disabled={loading}
                            >
                              <Github className="w-5 h-5 mr-2" />
                              GitHub
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Step 2: Email Registration */}
                {currentStep === 2 && (
                  <div ref={el => { stepRefs.current[1] = el }} className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-gray-800">
                        Creează-ți contul
                      </h2>
                      <p className="text-gray-600">
                        Completează informațiile de mai jos
                      </p>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      {/* Username Field */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                            Username
                          </Label>
                          <span className={`text-xs ${formData.username.length > 13 ? 'text-red-500' : 'text-gray-500'}`}>
                            {formData.username.length}/13
                          </span>
                        </div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="username"
                            type="text"
                            placeholder="Alege un username"
                            value={formData.username}
                            onChange={(e) => updateFormData("username", e.target.value)}
                            className={`pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12 ${formData.username.length > 13 ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''}`}
                            maxLength={13}
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

                      {/* Confirm Password Field */}
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

                      {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 h-12 text-lg font-semibold cosmic-glow"
                    disabled={loading}
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                        {loading ? "Se creează..." : "Continuă"}
                  </Button>
                </form>
                  </div>
                )}

                {/* Step 3: Success */}
                {currentStep === 3 && (
                  <div ref={el => { stepRefs.current[2] = el }}>
                    <div ref={successRef} className="text-center space-y-6">
                      <div className="flex justify-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                </div>

                      <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-gray-800">
                          Buna, {formData.username}! 👋
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                          Contul tău Planck a fost creat cu succes. Abia așteptăm să vezi cum clasa ta va străluci alături de tine!
                        </p>
                      </div>

                      <div className="flex justify-center space-x-2">
                        <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                        <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>

                      <Button
                        onClick={() => router.push("/probleme")}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 h-12 text-lg font-semibold cosmic-glow"
                      >
                        Incepe acum
                      </Button>
                </div>
                  </div>
                )}

                {/* Login Link */}
                {currentStep === 1 && (
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
                )}
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
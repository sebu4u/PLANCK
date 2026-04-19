"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rocket, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { LoginButton } from "@/components/LoginButton"
import Link from "next/link"

// Apple icon SVG component
const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
)

// Microsoft icon SVG component
const MicrosoftIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
)

function LoginPageContent() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState<"email" | null>(null)

    const [step, setStep] = useState<"email" | "password">("email")
    const [password, setPassword] = useState("")

    // Check for "error" query param from Supabase Auth redirect
    const { toast } = useToast()
    const router = useRouter()
    const { user } = useAuth()

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push("/dashboard")
        }
    }, [user, router])

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Prevent TopLoader from triggering since we remain on the same page
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            toast({
                title: "Eroare",
                description: "Te rugăm să introduci un email valid",
                variant: "destructive",
            })
            return
        }
        setStep("password")
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) {
            toast({
                title: "Eroare",
                description: "Te rugăm să introduci parola",
                variant: "destructive",
            })
            return
        }

        setLoading("email")

        const { supabase } = await import("@/lib/supabaseClient")

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            toast({
                title: "Eroare la autentificare",
                description: error.message === "Invalid logs" ? "Date de logare incorecte." : error.message,
                variant: "destructive",
            })
            setLoading(null)
        } else {
            // Success! The auth listener in AuthProvider will pick this up and redirect
            // But we can also force a redirect or just wait for the loop
            router.push("/dashboard")
        }
    }

    return (
        <div className="min-h-screen w-full bg-white flex flex-col">
            {/* Header with Logo */}
            <header className="w-full px-6 py-6">
                <Link href="/" className="flex items-center gap-2 w-fit text-2xl font-bold text-black title-font">
                    <Rocket className="w-6 h-6 text-black" />
                    <span>PLANCK</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 pb-8">
                <div className="w-full max-w-[400px] flex flex-col items-center">

                    {/* Title */}
                    <h1 className="text-[32px] font-semibold text-black mb-8 text-center animate-in slide-in-from-bottom-2 fade-in duration-300">
                        {step === "email" ? "Welcome back" : "Enter your password"}
                    </h1>

                    {step === "email" && (
                        <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
                            {/* Email Form */}
                            <form onSubmit={handleEmailSubmit} className="w-full space-y-4 mb-4">
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full h-12 px-4 border border-gray-300 rounded-full text-black placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 focus:outline-none bg-white transition-all"
                                />
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium text-base transition-colors"
                                >
                                    Continue
                                </Button>
                            </form>

                            {/* Register Link */}
                            <p className="text-sm text-center text-gray-600 mb-6">
                                Don't have an account?{" "}
                                <Link
                                    href="/register"
                                    className="text-[#10a37f] hover:text-[#0d8c6d] font-medium transition-colors"
                                >
                                    Sign up
                                </Link>
                            </p>

                            {/* Divider */}
                            <div className="w-full flex items-center gap-4 mb-6">
                                <div className="flex-1 h-px bg-gray-200"></div>
                                <span className="text-xs text-gray-500 font-medium">OR</span>
                                <div className="flex-1 h-px bg-gray-200"></div>
                            </div>

                            {/* Social Login Buttons */}
                            <div className="w-full space-y-3">
                                <LoginButton
                                    className="w-full"
                                    onError={(msg) =>
                                        toast({
                                            title: "Eroare la autentificare cu Google",
                                            description: msg,
                                            variant: "destructive",
                                        })
                                    }
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={true}
                                    className="w-full h-12 border border-gray-200 rounded-full bg-gray-50 text-gray-400 font-medium text-base transition-colors flex items-center justify-center gap-3 opacity-50 cursor-not-allowed grayscale"
                                >
                                    <AppleIcon />
                                    <span>Continue with Apple</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={true}
                                    className="w-full h-12 border border-gray-200 rounded-full bg-gray-50 text-gray-400 font-medium text-base transition-colors flex items-center justify-center gap-3 opacity-50 cursor-not-allowed grayscale"
                                >
                                    <MicrosoftIcon />
                                    <span>Continue with Microsoft</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={true}
                                    className="w-full h-12 border border-gray-200 rounded-full bg-gray-50 text-gray-400 font-medium text-base transition-colors flex items-center justify-center gap-3 opacity-50 cursor-not-allowed grayscale"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>Continue with phone</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "password" && (
                        <div className="w-full animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="mb-6">
                                <button
                                    onClick={() => setStep("email")}
                                    className="text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors mb-2"
                                >
                                    ← Back
                                </button>
                                <div className="text-gray-500 text-sm">Logging in as <span className="text-black font-medium">{email}</span></div>
                            </div>

                            <form onSubmit={handleLogin} className="w-full space-y-4">
                                <div className="space-y-1">
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full h-12 px-4 border border-gray-300 rounded-full text-black placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 focus:outline-none bg-white"
                                    />
                                    <div className="flex justify-end pt-1">
                                        <Link href="/reset-password" className="text-xs text-[#10a37f] hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading === "email"}
                                    className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium text-base transition-colors mt-2"
                                >
                                    {loading === "email" ? "Logging in..." : "Log In"}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-6 flex justify-center">
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/terms" className="text-gray-500 hover:text-gray-700 underline transition-colors">
                        Terms of Use
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-700 underline transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </footer>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}

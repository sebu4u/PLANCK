"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { Rocket, CheckCircle2, ArrowLeft, GraduationCap, School, User, Copy, Check } from "lucide-react"

export default function ContestRegistrationPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { toast } = useToast()

    const [fullName, setFullName] = useState("")
    const [school, setSchool] = useState("")
    const [grade, setGrade] = useState("")
    const [loading, setLoading] = useState(false)
    const [checkingStatus, setCheckingStatus] = useState(true)
    const [existingRegistration, setExistingRegistration] = useState<{
        contest_code: string
        full_name: string
        school: string
        grade: string
    } | null>(null)
    const [newContestCode, setNewContestCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Check if user is already registered
    useEffect(() => {
        const checkStatus = async () => {
            if (!user) {
                setCheckingStatus(false)
                return
            }

            try {
                const { data: sessionData } = await supabase.auth.getSession()
                const accessToken = sessionData.session?.access_token

                if (!accessToken) {
                    setCheckingStatus(false)
                    return
                }

                const response = await fetch('/api/contest/status', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                })
                const data = await response.json()

                if (data.registered && data.registration) {
                    setExistingRegistration(data.registration)
                }
            } catch (error) {
                console.error('Error checking registration status:', error)
            } finally {
                setCheckingStatus(false)
            }
        }

        if (!authLoading && user) {
            checkStatus()
        } else if (!authLoading) {
            setCheckingStatus(false)
        }
    }, [user, authLoading])

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?returnUrl=/concurs/inscriere')
        }
    }, [user, authLoading, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!fullName.trim() || !school.trim() || !grade) {
            toast({
                title: "Date incomplete",
                description: "Te rugăm să completezi toate câmpurile",
                variant: "destructive"
            })
            return
        }

        setLoading(true)

        try {
            const { data: sessionData } = await supabase.auth.getSession()
            const accessToken = sessionData.session?.access_token

            if (!accessToken) {
                toast({
                    title: "Eroare",
                    description: "Sesiune expirată. Te rugăm să te autentifici din nou.",
                    variant: "destructive"
                })
                setLoading(false)
                return
            }

            const response = await fetch('/api/contest/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    full_name: fullName,
                    school,
                    grade
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Eroare la înregistrare')
            }

            if (data.success) {
                setNewContestCode(data.contest_code)
                toast({
                    title: "Felicitări! 🎉",
                    description: "Te-ai înscris cu succes la concurs!"
                })
            }
        } catch (error: any) {
            toast({
                title: "Eroare",
                description: error.message || "Eroare la înregistrare. Te rugăm să încerci din nou.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
            title: "Cod copiat!",
            description: "Codul a fost copiat în clipboard"
        })
    }

    // Show loading state
    if (authLoading || checkingStatus) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
            </div>
        )
    }

    const displayCode = newContestCode || existingRegistration?.contest_code

    return (
        <div className="min-h-screen w-full bg-white flex flex-col">
            {/* Header */}
            <header className="w-full px-6 py-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 w-fit text-2xl font-bold text-black title-font">
                    <Rocket className="w-6 h-6 text-black" />
                    <span>PLANCK</span>
                </Link>
                <Link
                    href="/concurs"
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Înapoi la concurs</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 pb-12">
                <div className="w-full max-w-lg">

                    {/* Success State - Show contest code */}
                    {displayCode ? (
                        <div className="animate-in fade-in zoom-in duration-300 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {newContestCode ? "Ești înscris!" : "Ești deja înscris!"}
                            </h1>

                            <p className="text-gray-600 mb-8">
                                {newContestCode
                                    ? "Felicitări! Ai fost înregistrat cu succes la Concursul Național de Fizică PLANCK."
                                    : "Ești deja înregistrat la Concursul Național de Fizică PLANCK."
                                }
                            </p>

                            {/* Contest Code Display */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 mb-8 border border-orange-200">
                                <p className="text-sm font-medium text-orange-800 mb-3">
                                    Codul tău de concurs:
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-4xl font-mono font-bold text-gray-900 tracking-wider">
                                        {displayCode}
                                    </span>
                                    <button
                                        onClick={() => copyCode(displayCode)}
                                        className="p-2 rounded-lg bg-white/80 hover:bg-white border border-orange-200 transition-all"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-orange-700 mt-4">
                                    Păstrează acest cod! Îl vei folosi pentru a accesa subiectele în ziua concursului.
                                </p>
                            </div>

                            {/* Registration Details */}
                            {existingRegistration && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Detalii înscriere:</h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><span className="font-medium">Nume:</span> {existingRegistration.full_name}</p>
                                        <p><span className="font-medium">Școală:</span> {existingRegistration.school}</p>
                                        <p><span className="font-medium">Clasă:</span> a {existingRegistration.grade}-a</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/profil">
                                    <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 py-6">
                                        Vezi profilul tău
                                    </Button>
                                </Link>
                                <Link href="/concurs">
                                    <Button variant="outline" className="border-gray-300 rounded-full px-8 py-6">
                                        Înapoi la concurs
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* Registration Form */
                        <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <GraduationCap className="w-8 h-8 text-orange-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                    Înscrie-te la concurs
                                </h1>
                                <p className="text-gray-600">
                                    Concursul Național de Fizică PLANCK - Ediția 2026
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nume complet
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Ex: Popescu Ion"
                                            className="pl-12 h-12 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                {/* School */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Școala
                                    </label>
                                    <div className="relative">
                                        <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            value={school}
                                            onChange={(e) => setSchool(e.target.value)}
                                            placeholder="Ex: Colegiul Național ..."
                                            className="pl-12 h-12 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>

                                {/* Grade */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Clasa
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {['IX', 'X', 'XI', 'XII'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setGrade(g)}
                                                className={`py-3 px-4 rounded-xl font-semibold transition-all ${grade === g
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all mt-6"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Se procesează...</span>
                                        </div>
                                    ) : (
                                        "Înscrie-mă la concurs"
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                Prin înscrierea la concurs, ești de acord cu{" "}
                                <Link href="/termeni" className="text-orange-600 hover:underline">
                                    regulamentul concursului
                                </Link>
                                .
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

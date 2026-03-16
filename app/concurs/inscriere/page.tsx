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

        toast({
            title: "Înscrierile sunt închise",
            description: "Înscrierile pentru ediția curentă a concursului PLANCK s-au încheiat.",
            variant: "destructive"
        })
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
                        /* Registrations closed */
                        <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <GraduationCap className="w-8 h-8 text-gray-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                    Înscrierile sunt închise
                                </h1>
                                <p className="text-gray-600">
                                    Înscrierile pentru ediția curentă a Concursului Național de Fizică PLANCK s-au încheiat.
                                </p>
                            </div>

                            <div className="space-y-4 text-center text-gray-600">
                                <p>
                                    Dacă te-ai înscris deja, poți vedea codul tău de concurs mai sus sau în pagina{" "}
                                    <Link href="/profil" className="text-orange-600 hover:underline">
                                        profilului tău
                                    </Link>
                                    , dacă este disponibil acolo.
                                </p>
                                <p>
                                    Te așteptăm la următoarea ediție a concursului și te încurajăm să folosești în continuare materialele de pregătire de pe PLANCK.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

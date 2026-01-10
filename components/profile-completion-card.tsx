"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, User, GraduationCap, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function ProfileCompletionCard() {
    const { user, profile, refreshUser } = useAuth()
    const [nickname, setNickname] = useState("")
    const [grade, setGrade] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const { toast } = useToast()

    // Check if profile needs completion
    useEffect(() => {
        if (!user || !profile) {
            setIsVisible(false)
            return
        }

        // Check if nickname or grade is missing
        const needsNickname = !profile.nickname || profile.nickname.trim() === ""
        const needsGrade = !profile.grade

        if (needsNickname || needsGrade) {
            setIsVisible(true)
            // Pre-fill existing data if available
            if (profile.nickname) setNickname(profile.nickname)
            if (profile.grade) setGrade(profile.grade)
        } else {
            setIsVisible(false)
        }
    }, [user, profile])

    const handleSave = async () => {
        // Validation
        if (!nickname.trim()) {
            toast({
                title: "Username necesar",
                description: "Te rugăm să introduci un username pentru a continua.",
                variant: "destructive",
            })
            return
        }

        if (!grade) {
            toast({
                title: "Clasa necesară",
                description: "Te rugăm să selectezi clasa pentru a continua.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            // Map "Altceva" (which we'll use as a display value for 13) to 13 if needed
            // Actually, we'll store specific values in DB. 
            // User request: "Daca userul selecteaza ca este dintr-o alta clasa, sa se actualizeze in baza de date 13 la grade."

            const updateData = {
                nickname: nickname.trim(),
                grade: grade, // Logic for 13 is handled by the Select value itself
            }

            const { error } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("user_id", user.id)

            if (error) throw error

            toast({
                title: "Profil actualizat!",
                description: "Mulțumim pentru completarea datelor.",
            })

            // Refresh auth context to update profile and close modal
            await refreshUser()

            // Force hide (will be handled by effect anyway, but for immediate feedback)
            setIsVisible(false)

        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast({
                title: "Eroare",
                description: "A apărut o problemă la salvarea datelor. Te rugăm să încerci din nou.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Disable scroll when visible
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isVisible])

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md bg-[#0D0D0F] border-white/10 shadow-2xl relative overflow-hidden">
                {/* Decorative background gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Bine ai venit pe Planck!</CardTitle>
                    <CardDescription className="text-gray-400">
                        Pentru a continua, avem nevoie de câteva detalii despre tine.
                        Acestea ne ajută să îți personalizăm experiența.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                        {/* Nickname Input */}
                        <div className="space-y-2">
                            <Label htmlFor="nickname" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400" />
                                Username
                            </Label>
                            <Input
                                id="nickname"
                                placeholder="Cum vrei să te numim?"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                                autoComplete="off"
                            />
                            <p className="text-[10px] text-gray-500">
                                Acesta va fi numele tău public pe platformă.
                            </p>
                        </div>

                        {/* Grade Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="grade" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-purple-400" />
                                Clasa
                            </Label>
                            <Select value={grade} onValueChange={setGrade}>
                                <SelectTrigger id="grade" className="bg-white/5 border-white/10 text-white focus:ring-purple-500/20">
                                    <SelectValue placeholder="Selectează clasa" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#131316] border-white/10 text-white z-[10000]">
                                    <SelectItem value="9">Clasa a IX-a</SelectItem>
                                    <SelectItem value="10">Clasa a X-a</SelectItem>
                                    <SelectItem value="11">Clasa a XI-a</SelectItem>
                                    <SelectItem value="12">Clasa a XII-a</SelectItem>
                                    <SelectItem value="13">Altceva (Student / Pasionat)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-6 transition-all duration-300 shadow-lg shadow-blue-500/20"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Se salvează...
                            </>
                        ) : (
                            <>
                                Salvează și Continuă
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

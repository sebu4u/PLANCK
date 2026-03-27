"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { Target, Layers, Users, BookOpen, ChevronDown, CheckCircle2, XCircle, Clock, FileText, Award, ArrowRight } from "lucide-react"

// Accordion component for grade sections
function GradeAccordion({
    grade,
    topics,
    isOpen,
    onToggle
}: {
    grade: string
    topics: string[]
    isOpen: boolean
    onToggle: () => void
}) {
    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-300 hover:shadow-md">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white hover:from-orange-50 hover:to-white transition-all duration-300"
            >
                <span className="text-lg font-semibold text-gray-900">{grade}</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-5 pt-0 space-y-2">
                    {topics.map((topic, index) => (
                        <div key={index} className="flex items-center gap-2 text-gray-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            <span>{topic}</span>
                        </div>
                    ))}
                    <Link
                        href={`/antrenament?grade=${grade.includes("IX") ? 9 : grade.includes("X") && !grade.includes("XI") ? 10 : grade.includes("XI") ? 11 : 12}`}
                        className="inline-flex items-center gap-2 mt-4 text-orange-600 hover:text-orange-700 font-medium transition-colors group"
                    >
                        <span>👉 Acces la subiecte de antrenament pentru {grade.toLowerCase()}</span>
                        <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export function ConcursContent() {
    const [openGrade, setOpenGrade] = useState<string | null>(null)

    const gradeData = [
        {
            grade: "Clasa a IX-a",
            topics: [
                "Vectorul, operații cu vectori",
                "Punctul material",
                "MRU și MRUV",
                "Aruncarea punctului material",
                "Noțiuni de bază de dinamică",
                "Principiile dinamicii",
                "Mecanisme simple"
            ]
        },
        {
            grade: "Clasa a X-a",
            topics: [
                "Optică geometrică",
                "Proprietăți ale gazelor",
                "Ecuația de stare a gazului ideal",
                "Transformări termodinamice",
                "Lucrul mecanic și energia internă",
                "Principiul I al termodinamicii"
            ]
        },
        {
            grade: "Clasa a XI-a",
            topics: [
                "Circuite electrice simple",
                "Legea lui Ohm",
                "Legile lui Kirchhoff",
                "Grupări de rezistoare / rezistența echivalentă",
                "Oscilații armonice",
                "Elongație, viteză, accelerație",
                "Perioada pendulului / resortului",
                "Energia mecanică"
            ]
        },
        {
            grade: "Clasa a XII-a",
            topics: ["Toată materia din clasele anterioare"]
        }
    ]

    return (
        <div className="min-h-screen bg-white">

            {/* Hero Section */}
            <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
                {/* Background with Orange Blob and Glass Effect */}
                <div className="absolute inset-0">
                    {/* Base Background - White at top transitioning down */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#f0e8e0]" />

                    {/* Large Orange Blob - Main radial glow from bottom center, extending up to title */}
                    <div
                        className="absolute bottom-[-50%] left-1/2 -translate-x-1/2 w-[200%] h-[180%]"
                        style={{
                            background: 'radial-gradient(ellipse 70% 55% at 50% 75%, rgba(235, 115, 50, 1) 0%, rgba(235, 130, 60, 0.85) 8%, rgba(230, 120, 50, 0.7) 15%, rgba(220, 130, 60, 0.5) 25%, rgba(200, 140, 80, 0.3) 38%, rgba(200, 150, 100, 0.15) 50%, rgba(220, 180, 150, 0.05) 62%, transparent 72%)',
                        }}
                    />

                    {/* Secondary Orange Glow - More saturated center */}
                    <div
                        className="absolute bottom-[-40%] left-1/2 -translate-x-1/2 w-[150%] h-[130%]"
                        style={{
                            background: 'radial-gradient(ellipse 60% 50% at 50% 80%, rgba(245, 100, 30, 1) 0%, rgba(240, 120, 40, 0.75) 10%, rgba(230, 140, 60, 0.5) 22%, rgba(220, 150, 80, 0.25) 38%, rgba(210, 160, 100, 0.08) 52%, transparent 65%)',
                        }}
                    />

                    {/* Glass Effect Overlay - Subtle blur over the orange */}
                    <div
                        className="absolute inset-0 backdrop-blur-[2px]"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 40%, rgba(255, 255, 255, 0.05) 70%, transparent 100%)',
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    {/* Main Title */}
                    <h1 className="scroll-animate-fade-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 leading-tight">
                        Concursul Național de Fizică <span className="font-black">PLANCK</span>
                    </h1>

                    {/* Edition Subtitle */}
                    <p className="scroll-animate-fade-up animate-delay-200 text-xl sm:text-2xl md:text-3xl text-gray-800 mb-4 font-medium">
                        Ediția 2026
                    </p>

                    {/* Date & Time Badge */}
                    <div className="scroll-animate-fade-up animate-delay-300 flex items-center justify-center mb-10 px-2">
                        <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-2xl sm:rounded-full bg-white/95 px-4 sm:px-6 py-3 text-xs sm:text-sm md:text-base font-semibold text-gray-900 shadow-md border border-orange-200 max-w-md">
                            <span className="text-base sm:text-lg">📅</span>
                            <span className="text-center leading-snug">
                                Concursul are loc <span className="font-bold">Duminică, 22 martie</span> de la ora <span className="font-bold">12:00</span>
                            </span>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="scroll-animate-fade-up animate-delay-400 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/concurs/proba" prefetch={false}>
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25 border-0 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold"
                            >
                                Intră la probă
                                <ArrowRight className="h-5 w-5" aria-hidden />
                            </Button>
                        </Link>
                        <Link href="/concurs/regulament">
                            <Button
                                variant="outline"
                                size="lg"
                                className="bg-transparent border-2 border-gray-800 text-gray-900 hover:bg-gray-900/10 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold"
                            >
                                Regulament concurs
                            </Button>
                        </Link>
                        <Link href="/concurs/rezultate">
                            <Button
                                variant="outline"
                                size="lg"
                                className="bg-transparent border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold"
                            >
                                Rezultate concurs
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Content Section - White Card overlapping hero */}
            <section className="relative z-20 w-full px-4 sm:px-8 lg:px-16 xl:px-24 -mt-24 pb-16">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

                    {/* Section 1: De ce există acest concurs */}
                    <div className="p-8 sm:p-12 lg:p-16 border-b border-gray-100">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50">
                                    <Target className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
                                    De ce există acest concurs
                                </span>
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                                De ce încă un concurs de fizică?
                            </h2>

                            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                                <p>
                                    Majoritatea concursurilor de fizică ajung să testeze fie viteza, fie șmecheriile de calcul.
                                    <span className="font-semibold text-gray-900"> PLANCK</span> a fost creat dintr-o altă nevoie: să existe un concurs care să pună accent pe <span className="text-orange-600 font-medium">gândirea fizică</span>, pe <span className="text-orange-600 font-medium">idei clare</span> și pe <span className="text-orange-600 font-medium">rezolvări corecte</span>, nu pe trucuri.
                                </p>
                                <div className="bg-gradient-to-r from-gray-50 to-transparent p-6 rounded-2xl border-l-4 border-orange-400">
                                    <p className="text-gray-700">
                                        Acest concurs nu este despre a „prinde" elevul nepregătit.
                                        <br />
                                        <strong className="text-gray-900">Este despre a vedea cât de bine înțelegi fizica</strong>, indiferent dacă te pregătești pentru performanță sau pur și simplu vrei să fii bun.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Structura concursului */}
                    <div className="p-8 sm:p-12 lg:p-16 border-b border-gray-100 bg-gradient-to-br from-gray-50/50 to-white">
                        <div className="max-w-4xl mx-auto">
                            <div className="scroll-animate-fade-up flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50">
                                    <Layers className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                                    Structura concursului
                                </span>
                            </div>

                            <h2 className="scroll-animate-fade-up animate-delay-100 text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
                                Structura concursului
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Etapa 1 */}
                                <div className="scroll-animate-fade-left animate-delay-200 group relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all duration-300">
                                    <div className="absolute top-0 left-6 -translate-y-1/2">
                                        <span className="bg-gradient-to-r from-orange-500 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            ETAPA 1
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mt-2 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-orange-500" />
                                        Grilă (calificare)
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <span className="text-sm font-bold text-orange-600">30</span>
                                            </div>
                                            <span>probleme</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <span>2 ore</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-orange-600">💻</span>
                                            </div>
                                            <span>desfășurare online</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-orange-600">📚</span>
                                            </div>
                                            <span>subiecte diferențiate (IX–XII)</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 border-t border-gray-100 pt-4">
                                        Această etapă testează înțelegerea conceptelor fundamentale și capacitatea de a raționa corect sub presiunea timpului.
                                    </p>
                                </div>

                                {/* Etapa 2 */}
                                <div className="scroll-animate-fade-right animate-delay-300 group relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                                    <div className="absolute top-0 left-6 -translate-y-1/2">
                                        <span className="bg-gradient-to-r from-blue-500 to-blue-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            ETAPA 2
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mt-2 mb-4 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-blue-500" />
                                        Scris (finală)
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-blue-600">🏆</span>
                                            </div>
                                            <span>calificare pentru cei mai buni</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <span className="text-sm font-bold text-blue-600">3</span>
                                            </div>
                                            <span>probleme</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span>3 ore</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-blue-600">✍️</span>
                                            </div>
                                            <span>rezolvare completă, evaluată riguros</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 border-t border-gray-100 pt-4">
                                        Etapa scrisă este despre argumentare, claritate și construcția unei soluții corecte de la cap la coadă.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Pentru cine este concursul */}
                    <div className="p-8 sm:p-12 lg:p-16 border-b border-gray-100">
                        <div className="max-w-4xl mx-auto">
                            <div className="scroll-animate-fade-up flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-100 to-green-50">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                                    Pentru cine este concursul
                                </span>
                            </div>

                            <h2 className="scroll-animate-fade-up animate-delay-100 text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
                                Este acest concurs pentru tine?
                            </h2>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Este pentru tine */}
                                <div className="scroll-animate-fade-left animate-delay-200 bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100">
                                    <h3 className="text-lg font-bold text-green-700 mb-5 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Este pentru tine dacă:
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            "vrei să vezi unde te situezi față de alți elevi serioși",
                                            "vrei probleme care chiar te pun pe gânduri",
                                            "îți pasă de explicații, nu doar de răspunsuri",
                                            "vrei un concurs corect, bine structurat"
                                        ].map((item, index) => (
                                            <li key={index} className="flex items-start gap-3 text-gray-700">
                                                <span className="text-green-500 mt-0.5">✔</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Nu este pentru tine */}
                                <div className="scroll-animate-fade-right animate-delay-300 bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 border border-red-100">
                                    <h3 className="text-lg font-bold text-red-700 mb-5 flex items-center gap-2">
                                        <XCircle className="w-5 h-5" />
                                        Nu este pentru tine dacă:
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            "cauți doar puncte ușoare",
                                            "vrei să treci doar prin noroc la grilă",
                                            "nu te interesează rezolvarea completă și riguroasă"
                                        ].map((item, index) => (
                                            <li key={index} className="flex items-start gap-3 text-gray-700">
                                                <span className="text-red-500 mt-0.5">✖</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orange Fade Out Effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-50/80 via-white/50 to-transparent pointer-events-none" />
                </div>
            </section>

            {/* Section 4: Subiecte de antrenament (Moved Outside) */}
            <section className="relative z-10 w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-16" id="subiecte">
                <div className="max-w-4xl mx-auto">
                    <div className="scroll-animate-fade-up flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                            Subiecte de antrenament
                        </span>
                    </div>

                    <h2 className="scroll-animate-fade-up animate-delay-100 text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Ce materie intră în concurs?
                    </h2>

                    <p className="scroll-animate-fade-up animate-delay-200 text-lg text-gray-600 mb-10">
                        Pentru transparență totală, structura concursului este clară încă de la început.
                        Mai jos găsești temele pentru fiecare clasă, împreună cu materiale de antrenament.
                    </p>

                    <div className="scroll-animate-fade-up animate-delay-300 space-y-4">
                        {gradeData.map((data) => (
                            <GradeAccordion
                                key={data.grade}
                                grade={data.grade}
                                topics={data.topics}
                                isOpen={openGrade === data.grade}
                                onToggle={() => setOpenGrade(openGrade === data.grade ? null : data.grade)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 5: Cum ma pregatesc (New Section) */}
            <section className="relative z-10 w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-16 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="scroll-animate-fade-up text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Cum mă pregătesc pentru concurs
                        </h2>
                        <p className="text-xl text-gray-600">
                            Resurse esențiale și materiale didactice structurate pe clase
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['Clasa a IX-a', 'Clasa a X-a', 'Clasa a XI-a', 'Clasa a XII-a'].map((cls, idx) => (
                            <div key={idx} className={`scroll-animate-fade-up animate-delay-${(idx + 1) * 100} bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600 font-bold text-xl">
                                    {['IX', 'X', 'XI', 'XII'][idx]}
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-4">{cls}</h3>

                                <ul className="space-y-3">
                                    {['Lecții Teorie', 'Probleme Rezolvate', 'Teste Antrenament'].map((item, i) => (
                                        <li key={i}>
                                            <Link
                                                href="#"
                                                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-orange-500 transition-colors" />
                                                <span className="text-sm font-medium">{item}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                <Link href={idx === 0 ? "/concurs/materialeIX" : idx === 1 ? "/concurs/materialeX" : idx === 2 ? "/concurs/materialeXI" : "/concurs/materialeXII"}>
                                    <Button
                                        className="w-full mt-6 bg-gray-900 text-white hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Vezi Materiale
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 6: Premii și recunoaștere + CTA */}
            <section className="relative z-10 w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-20 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="scroll-animate-fade-up text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Premii și recunoaștere
                    </h2>
                    <p className="scroll-animate-fade-up animate-delay-100 text-xl text-gray-600 mb-12">
                        Concursul pune accent pe valoare academică, nu doar pe clasament.
                    </p>

                    <div className="scroll-animate-fade-up animate-delay-200 flex flex-wrap justify-center gap-6 text-left mb-12">
                        {[
                            { icon: '🏆', text: 'Clasament național pe fiecare clasă' },
                            { icon: '📜', text: 'Diplome pentru participanți și finaliști' },
                            { icon: '🎁', text: 'Premii în abonamente în valoare totală de 1000 de lei' },
                            { icon: '📚', text: 'Sesiuni de pregătire gratuite pentru etapa a II-a' },
                            { icon: '🔓', text: 'Acces la resurse educaționale exclusive pe PLANCK' },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-orange-300 transition-all duration-300 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-gray-700 font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <p className="scroll-animate-fade-up animate-delay-300 text-gray-500 text-sm mb-16">
                        Detaliile complete despre premii vor fi anunțate înainte de concurs.
                    </p>

                    {/* CTA Section */}
                    <div className="scroll-animate-fade-up animate-delay-400 pt-12 border-t border-gray-200">
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            Înscrierile sunt închise
                        </h3>

                        <p className="text-lg text-gray-700 mb-6">
                            Înscrierile pentru ediția curentă a concursului PLANCK s-au încheiat. Te așteptăm la următoarea ediție.
                        </p>

                        <p className="text-gray-500 text-sm">
                            Poți în continuare să consulți regulamentul și materialele de pregătire disponibile pe această pagină.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="scroll-animate-fade-up w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-12 bg-white border-t border-gray-200">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-gray-900">PLANCK</span>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <Link href="/termeni" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Termeni și Condiții
                            </Link>
                            <Link href="/confidentialitate" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Politica de Confidențialitate
                            </Link>
                            <Link href="/contact" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Contact
                            </Link>
                        </div>

                        {/* Copyright */}
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} PLANCK. Toate drepturile rezervate.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

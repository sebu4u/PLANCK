"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LayoutGrid, Video, UserPlus } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"

interface ChatMessage {
    role: "user" | "assistant"
    content: string
    isStreaming?: boolean
}

export function AIDemoSection() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isAnimating, setIsAnimating] = useState(false)
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
    const [displayedText, setDisplayedText] = useState("")
    const chatContainerRef = useRef<HTMLDivElement>(null)

    const userMessage = "Vreau să văd soluția"

    const assistantResponses = [
        `Hai să o luăm pas cu pas.
Știm viteza și distanța. Ni se cere timpul.
Pentru mișcare rectilinie uniformă, folosim relația: t = s / v`,
        `Înlocuim valorile din problemă: t = 120 / 4
Calculăm: t = 30 s`,
        `Răspuns: Corpul parcurge distanța de 120 m în 30 de secunde.`
    ]

    const [showButton, setShowButton] = useState(true)

    const handleButtonClick = () => {
        if (isAnimating || messages.length > 0) return

        setIsAnimating(true)
        setShowButton(false) // Hide button immediately
        // Add user message
        setMessages([{ role: "user", content: userMessage }])

        // Start streaming assistant responses after a short delay
        setTimeout(() => {
            streamNextMessage(0)
        }, 500)
    }

    const streamNextMessage = (index: number) => {
        if (index >= assistantResponses.length) {
            setIsAnimating(false)
            return
        }

        setCurrentMessageIndex(index)
        const text = assistantResponses[index]
        let charIndex = 0
        setDisplayedText("")

        // Add empty streaming message
        setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }])

        const streamInterval = setInterval(() => {
            if (charIndex < text.length) {
                setDisplayedText(text.slice(0, charIndex + 1))
                charIndex++
            } else {
                clearInterval(streamInterval)
                // Mark message as complete
                setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                        role: "assistant",
                        content: text,
                        isStreaming: false
                    }
                    return newMessages
                })

                // Stream next message after a short pause
                setTimeout(() => {
                    streamNextMessage(index + 1)
                }, 400)
            }
        }, 15)
    }

    // Update the last streaming message with displayed text
    useEffect(() => {
        if (displayedText && messages.length > 0) {
            setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage && lastMessage.isStreaming) {
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        content: displayedText
                    }
                }
                return newMessages
            })
        }
    }, [displayedText])

    return (
        <section
            className="relative w-full py-20 lg:py-28"
            style={{
                backgroundColor: '#f6f5f4'
            }}
        >
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <FadeInUp className="flex flex-col items-center mb-16">
                    <div className="text-left">
                        <h2
                            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4"
                            style={{ color: '#0b0d10' }}
                        >
                            La revedere,<br />
                            explicații plictisitoare din clasă.
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                            Planck îți arată soluția pas cu pas și te face să înțelegi fizica în câteva secunde.
                        </p>
                    </div>
                </FadeInUp>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                    {/* Left side - Problem statement */}
                    <FadeInUp delay={0.1} className="flex flex-col">
                        {/* Difficulty and Tags */}
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-200 text-gray-700">
                                problemă
                            </span>
                            <span
                                className="px-3 py-1 text-sm font-semibold rounded-full"
                                style={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    color: '#16a34a'
                                }}
                            >
                                ușor
                            </span>
                            <span className="text-gray-500 text-sm">
                                viteză • distanță • timp
                            </span>
                        </div>

                        {/* Problem text */}
                        <div className="mb-8">
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-500 leading-relaxed">
                                Un corp se deplasează rectiliniu uniform.
                            </p>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-500 leading-relaxed mt-2">
                                Viteza corpului este de 4 m/s.
                            </p>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-500 leading-relaxed mt-6">
                                a) Cât timp îi ia corpului să parcurgă distanța de 120 m?
                            </p>
                        </div>

                        {/* Data section */}
                        <div className="mb-4">
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-500">
                                Date:
                            </p>
                        </div>

                        {/* Data cards */}
                        <div className="flex flex-wrap gap-4">
                            <div
                                className="px-6 py-3 bg-white shadow-sm"
                                style={{
                                    borderRadius: '9999px'
                                }}
                            >
                                <span className="text-lg sm:text-xl font-semibold text-gray-700">
                                    v = 4 m/s
                                </span>
                            </div>
                            <div
                                className="px-6 py-3 bg-white shadow-sm"
                                style={{
                                    borderRadius: '9999px'
                                }}
                            >
                                <span className="text-lg sm:text-xl font-semibold text-gray-700">
                                    s = 120 m
                                </span>
                            </div>
                        </div>
                    </FadeInUp>

                    {/* Right side - AI Chat Card */}
                    <FadeInUp
                        delay={0.2}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col"
                        style={{
                            height: '420px'
                        }}
                    >
                        {/* Chat header */}
                        <div className="relative h-32 w-full shrink-0">
                            <img
                                src="/raptor1.png"
                                alt="RAPTOR1 AI"
                                className="h-full w-full object-cover object-[50%_25%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            <div className="absolute bottom-4 left-6">
                                <h3 className="text-xl font-bold text-white tracking-wide">
                                    RAPTOR1 AI
                                </h3>
                                <p className="text-sm text-gray-200">
                                    Asistent de fizică
                                </p>
                            </div>
                        </div>

                        {/* Chat messages area */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 px-6 py-4 overflow-hidden"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-400 text-center">
                                        Apasă butonul de mai jos pentru a vedea cum rezolv problema pas cu pas.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-lg ${message.role === "user"
                                                    ? "bg-gray-800 text-white rounded-br-md"
                                                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                                                    }`}
                                            >
                                                <p className="text-sm font-bold whitespace-pre-line leading-snug">
                                                    {message.content}
                                                    {message.isStreaming && (
                                                        <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse" />
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chat input area with button - only show when button is visible */}
                        {showButton && (
                            <div className="px-6 py-4 border-t border-gray-100">
                                <button
                                    onClick={handleButtonClick}
                                    className="w-full py-3 px-6 font-semibold text-white transition-all duration-300 bg-gray-800 hover:bg-gray-900 hover:shadow-lg hover:scale-105"
                                    style={{
                                        borderRadius: '9999px'
                                    }}
                                >
                                    Vreau să văd soluția
                                </button>
                            </div>
                        )}
                    </FadeInUp>
                </div>

                <FadeInUp delay={0.3} className="flex flex-col items-center mt-16 lg:mt-24">
                    {/* Feature Icons Row */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-2xl bg-blue-50">
                                <LayoutGrid className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="text-gray-700 font-semibold">1000+ Probleme rezolvate</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-2xl bg-blue-50">
                                <Video className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="text-gray-700 font-semibold">500+ solutii video</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-2xl bg-blue-50">
                                <UserPlus className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="text-gray-700 font-semibold">Total gratuit la inceput</span>
                        </div>
                    </div>

                    <p className="text-gray-600 text-lg mb-6 font-medium">
                        Vezi aici catalogul cu 1000+ probleme rezolvate de fizica si informatica
                    </p>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-orange-500 blur-lg opacity-50 animate-pulse rounded-full group-hover:opacity-75 transition-opacity duration-300"></div>
                        <Link href="/probleme">
                            <button className="relative z-10 px-10 py-4 bg-[#1a1d21] text-white font-bold rounded-full border-2 border-orange-500 hover:scale-105 transition-transform duration-300">
                                Sunt gata sa iau note mai mari
                            </button>
                        </Link>
                    </div>
                </FadeInUp>
            </div>
        </section>
    )
}

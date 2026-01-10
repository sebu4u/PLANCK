"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"

const faqItems = [
    {
        id: "1",
        question: "Cum știu că progresez cu adevărat?",
        answer: "Urmărim fiecare problemă rezolvată și îți oferim statistici clare despre progres. Vei vedea evoluția în timp real, punctele tale forte și zonele care necesită îmbunătățire."
    },
    {
        id: "2",
        question: "Este PLANCK potrivit pentru mine dacă nu sunt olimpic?",
        answer: "Absolut. PLANCK este construit pentru oricine vrea să înțeleagă fizica la un nivel profund, nu doar pentru olimpici. Explicațiile sunt clare și progresive, astfel încât să poți avansa în ritmul tău."
    },
    {
        id: "3",
        question: "Pot folosi platforma de pe telefon sau tabletă?",
        answer: "Da, PLANCK este optimizat pentru toate dispozitivele. Poți învăța oriunde te afli, fie că ești acasă sau în deplasare."
    },
    {
        id: "4",
        question: "Ce se întâmplă dacă nu înțeleg o explicație?",
        answer: "AI-ul nostru, Insight, este disponibil să te ghideze pas cu pas prin orice problemă. Pune întrebări și vei primi explicații personalizate până când totul devine clar."
    },
    {
        id: "5",
        question: "Pot cere o rambursare dacă nu sunt mulțumit?",
        answer: "Da, oferim garanție de rambursare în primele 14 zile. Dacă PLANCK nu este ceea ce căutai, îți returnăm banii fără întrebări."
    },
]

export function FAQSection() {
    const [openItemId, setOpenItemId] = useState<string | null>(null)

    const toggleItem = (id: string) => {
        setOpenItemId(openItemId === id ? null : id)
    }

    return (
        <section className="bg-[#f6f5f4] py-24 w-full">
            <div className="max-w-3xl mx-auto px-4 md:px-8">
                {/* Header */}
                <FadeInUp className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Întrebări frecvente
                    </h2>
                    <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-normal">
                        Răspunsuri rapide la cele mai comune întrebări despre PLANCK.
                    </p>
                </FadeInUp>

                {/* FAQ Items */}
                <FadeInUp delay={0.1} className="divide-y divide-gray-100">
                    {faqItems.map((item) => (
                        <div key={item.id} className="py-6">
                            <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full flex items-center justify-between text-left group"
                                aria-expanded={openItemId === item.id}
                            >
                                <span className="text-lg md:text-xl font-semibold text-gray-900 pr-4">
                                    {item.question}
                                </span>
                                <span className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
                                    {openItemId === item.id ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        <Plus className="w-5 h-5" />
                                    )}
                                </span>
                            </button>

                            <AnimatePresence initial={false}>
                                {openItemId === item.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <p className="pt-4 text-gray-500 leading-relaxed text-base md:text-lg">
                                            {item.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </FadeInUp>
            </div>
        </section>
    )
}

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { FAQ_ITEMS } from "@/lib/platform-marketing"

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
                        Răspunsuri rapide despre trasee, BAC, admitere și PLANCK.
                    </p>
                </FadeInUp>

                {/* FAQ Items */}
                <FadeInUp delay={0.1} className="divide-y divide-gray-100">
                    {FAQ_ITEMS.map((item) => (
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

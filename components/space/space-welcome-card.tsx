"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface SpaceWelcomeCardProps {
    onClose: () => void
}

export function SpaceWelcomeCard({ onClose }: SpaceWelcomeCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-4 pb-4 pt-20"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0D0D0F] border border-white/10 shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 rounded-full bg-black/50 p-2 text-white/70 hover:bg-black/70 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Hero Image Section */}
                <div className="relative h-48 md:h-64 w-full">
                    <Image
                        src="/images/space-welcome.png"
                        alt="Welcome to Space"
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Gradient Overlay for Fadeout */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-transparent to-transparent" />

                    {/* Text overlay */}
                    <div className="absolute bottom-4 left-6 z-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-white drop-shadow-md font-mono">
                            WELCOME TO SPACE.
                        </h2>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 md:p-6 pt-2 text-white">
                    <div className="space-y-2 md:space-y-4 text-white/80 leading-relaxed text-sm md:text-base">
                        <p className="hidden md:block">
                            Bine ai venit în universul fizicii! Aici poți explora conceptele și formulele fizice sub forma unui <span className="text-blue-400 font-semibold">graf interactiv</span>.
                        </p>
                        <p className="block md:hidden">
                            Explorează conceptele fizice într-un <span className="text-blue-400 font-semibold">graf interactiv</span>.
                        </p>
                        <ul className="space-y-1 md:space-y-2 list-disc list-inside text-white/70 ml-1">
                            <li className="hidden md:list-item">Fiecare <strong>nod</strong> reprezintă un concept.</li>
                            <li className="list-item md:hidden"><strong>Noduri</strong> = concepte fizice.</li>

                            <li className="hidden md:list-item"><strong>Legăturile</strong> arată cum se interconectează acestea.</li>
                            <li className="list-item md:hidden"><strong>Legături</strong> = conexiuni între ele.</li>

                            <li className="hidden md:list-item">Dă <strong>click</strong> pe un nod pentru a vedea definiții și detalii.</li>
                            <li className="list-item md:hidden"><strong>Click</strong> pe nod pentru detalii.</li>
                        </ul>
                        <p className="hidden md:block">
                            Navighează liber, trage de noduri și descoperă cum se leagă totul în universul fizicii.
                        </p>
                    </div>
                </div>

                <div className="mt-4 md:mt-8 pb-6 flex justify-center">
                    <Button
                        onClick={onClose}
                        className="bg-white text-black hover:bg-white/90 px-8 py-2 rounded-full font-medium transition-all"
                    >
                        <span className="md:hidden">Explorează</span>
                        <span className="hidden md:inline">Explorează Universul</span>
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    )
}

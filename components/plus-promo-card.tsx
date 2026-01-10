"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface PlusPromoCardProps {
    isOpen: boolean
    onClose: () => void
}

export function PlusPromoCard({ isOpen, onClose }: PlusPromoCardProps) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-6 right-6 z-50 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#181818] shadow-2xl"
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 z-20 rounded-full bg-black/40 p-1.5 text-gray-200 hover:bg-black/60 hover:text-white transition-colors backdrop-blur-md"
                >
                    <X className="h-3 w-3" />
                </button>

                {/* Image Section - 70% height */}
                <div className="relative h-32 w-full">
                    <img
                        src="/raptor1.png"
                        alt="RAPTOR1 AI"
                        className="h-full w-full object-cover object-[50%_25%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/20 to-transparent" />

                    <div className="absolute bottom-3 left-4">
                        <h2 className="text-xl font-bold tracking-wider text-white font-sans uppercase drop-shadow-md" style={{ fontFamily: 'Horizon, sans-serif' }}>
                            RAPTOR1
                        </h2>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 pt-2">
                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                        Deblochează puterea completă a <span className="text-blue-400 font-semibold">RAPTOR1</span> cu planul Plus.
                    </p>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                        onClick={() => {
                            window.location.href = '/pricing'
                        }}
                    >
                        Upgrade to Plus
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

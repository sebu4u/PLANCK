"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export function ReferralPromoCard() {
    const router = useRouter()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="fixed bottom-6 right-6 z-50 w-[220px] cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#181818] shadow-2xl transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            onClick={() => router.push('/profil/referral')}
        >
            {/* Image Section */}
            <div className="relative h-20 w-full">
                <img
                    src="/referral-card-bg.png"
                    alt="Referral Program"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/10 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="p-3 pt-2 pb-3">
                <p className="text-xs font-medium text-gray-200 leading-snug">
                    Invită un prieten <span className="text-blue-400">→</span> <br />
                    <span className="text-blue-400 font-bold">1 lună Plus gratuit</span>
                </p>
            </div>
        </motion.div>
    )
}

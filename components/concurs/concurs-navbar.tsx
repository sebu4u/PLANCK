"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { PlanckUserAvatar } from "@/components/planckpass/planck-user-avatar"
import { useEquippedCosmetics } from "@/components/planckpass/planckpass-inventory"

export function ConcursNavbar() {
    const router = useRouter()
    const { user, loading, profile } = useAuth()
    const cosmetics = useEquippedCosmetics()

    if (loading) {
        return null
    }

    return (
        <div className="fixed top-6 left-0 right-0 z-[300] flex justify-center px-4">
            <nav className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-4 sm:px-6 py-3 flex items-center gap-4 sm:gap-6 transition-transform duration-300 md:hover:scale-105">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors"
                >
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                    <span className="text-lg sm:text-xl font-extrabold title-font hidden sm:block">PLANCK</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <Link
                        href="/concurs/regulament"
                        className="text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors rounded-full hover:bg-gray-100 leading-none flex items-center"
                    >
                        Regulament
                    </Link>
                    <Link
                        href="/cursuri"
                        className="text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors rounded-full hover:bg-gray-100 leading-none flex items-center"
                    >
                        Cursuri
                    </Link>
                </div>

                {/* Sign Up / User Icon */}
                <div className="flex items-center">
                    {user ? (
                        <button
                            onClick={() => router.push('/profil')}
                            className="flex items-center justify-center"
                        >
                            <PlanckUserAvatar
                              size={32}
                              src={profile?.user_icon}
                              name={profile?.nickname || profile?.name || user.email || "U"}
                              borderPresetId={cosmetics.borderPresetId}
                              borderImageUrl={
                                cosmetics.borderPresetId ? null : cosmetics.border?.imageUrl
                              }
                              badgePresetId={cosmetics.badgePresetId}
                              badgeImageUrl={
                                cosmetics.badgePresetId ? null : cosmetics.badge?.imageUrl
                              }
                              avatarClassName="border-2 border-gray-200 hover:border-gray-400 transition-colors"
                              fallbackClassName="bg-gray-100 text-gray-700"
                            />
                        </button>
                    ) : (
                        <Button
                            onClick={() => router.push('/register')}
                            size="sm"
                            className="bg-gray-900 text-white hover:bg-gray-700 rounded-full px-4 text-sm font-medium"
                        >
                            Sign up
                        </Button>
                    )}
                </div>
            </nav>
        </div>
    )
}

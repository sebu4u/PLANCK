"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ConcursNavbar() {
    const router = useRouter()
    const { user, loading, profile } = useAuth()

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
                        href="#participa"
                        className="text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors rounded-full hover:bg-gray-100 leading-none flex items-center"
                    >
                        Participă
                    </Link>
                    <Link
                        href="#subiecte"
                        className="text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors rounded-full hover:bg-gray-100 leading-none flex items-center"
                    >
                        Subiecte
                    </Link>
                </div>

                {/* Sign Up / User Icon */}
                <div className="flex items-center">
                    {user ? (
                        <button
                            onClick={() => router.push('/profil')}
                            className="flex items-center justify-center"
                        >
                            <Avatar className="w-8 h-8 border-2 border-gray-200 hover:border-gray-400 transition-colors">
                                {profile?.user_icon ? (
                                    <AvatarImage src={profile.user_icon} alt={profile?.nickname || profile?.name || user.email || "U"} />
                                ) : null}
                                <AvatarFallback className="bg-gray-100 text-gray-700">
                                    {(profile?.nickname || profile?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
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

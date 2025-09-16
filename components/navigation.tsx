"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Menu, X, BookOpen, Calculator, Rocket, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, loading, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  if (loading) {
    // Poți returna un skeleton sau null pentru a nu afișa login/profil până nu știm starea userului
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-200 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative h-16 grid grid-cols-3 items-center">
          {/* Logo */}
          <div className="flex items-center h-full">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent title-font animate-fade-in flex-shrink-0 flex items-center gap-2"
            >
              <Rocket className="w-6 h-6 text-purple-600" />
              PLANCK
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex flex-1 justify-center animate-fade-in-delay-1 col-start-2 justify-self-center">
            <div className="flex items-center space-x-8">
              <Link
                href="/cursuri"
                className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105 space-hover rounded-lg"
              >
                <BookOpen size={16} />
                Cursuri
              </Link>
              <Link
                href="/probleme"
                className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105 space-hover rounded-lg"
              >
                <Calculator size={16} />
                Probleme
              </Link>
              <Link
                href="/despre"
                className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 space-hover rounded-lg"
              >
                Despre
              </Link>
            </div>
          </div>

          {/* Desktop Login/Profile Button - dreapta */}
          <div className="hidden md:flex items-center animate-fade-in-delay-2 justify-end">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-50 transition">
                    <Avatar>
                      {profile?.user_icon ? (
                        <AvatarImage src={profile.user_icon} alt={profile?.nickname || profile?.name || user.email || "U"} />
                      ) : null}
                      <AvatarFallback>{(profile?.nickname || profile?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800">{profile?.nickname || profile?.name || user.user_metadata?.name || user.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href="/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100">Profil</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed" disabled>
                    Clasa mea
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button
                      onClick={async () => {
                        await logout()
                        toast({ title: "Te-ai delogat cu succes!" })
                        router.push("/")
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/register">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-300 hover:border-purple-500 hover:text-purple-600 transition-all duration-300 hover:scale-105 flex items-center gap-2 bg-transparent"
                >
                  <LogIn size={16} />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden absolute right-0 top-0 h-full flex items-center pr-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-purple-600 focus:outline-none transition-all duration-300 hover:scale-110"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md">
            <Link
              href="/cursuri"
              className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3"
              onClick={() => setIsOpen(false)}
            >
              <BookOpen size={20} />
              Cursuri
            </Link>
            <Link
              href="/probleme"
              className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3"
              onClick={() => setIsOpen(false)}
            >
              <Calculator size={20} />
              Probleme
            </Link>
            <Link
              href="/despre"
              className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50"
              onClick={() => setIsOpen(false)}
            >
              Despre
            </Link>
            <button
              className="text-gray-400 cursor-not-allowed block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg w-full text-left"
              disabled
            >
              Clasa mea
            </button>
            <div className="border-t border-gray-200 pt-3 mt-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3">
                      <Avatar>
                        {profile?.user_icon ? (
                          <AvatarImage src={profile.user_icon} alt={profile?.nickname || profile?.name || user.email || "U"} />
                        ) : null}
                        <AvatarFallback>{(profile?.nickname || profile?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{profile?.nickname || profile?.name || user.user_metadata?.name || user.email}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href="/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100">Profil</a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <button
                        onClick={async () => {
                          await logout()
                          toast({ title: "Te-ai delogat cu succes!" })
                          router.push("/")
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/register"
                  className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn size={20} />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

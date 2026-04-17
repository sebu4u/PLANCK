import Link from "next/link"
import { Rocket } from "lucide-react"

type HomePageNavbarProps = {
  variant?: "dark" | "light"
}

export function HomePageNavbar({ variant = "dark" }: HomePageNavbarProps) {
  const isLight = variant === "light"

  return (
    <nav className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <Link
            href="/"
            className={`title-font animate-fade-in flex flex-shrink-0 items-center gap-2.5 text-3xl font-bold transition-colors ${
              isLight ? "text-gray-900 hover:text-gray-700" : "text-white hover:text-gray-300"
            }`}
          >
            <Rocket className={`h-7 w-7 ${isLight ? "text-gray-900" : "text-white"}`} />
            <span className="block font-black whitespace-nowrap">PLANCK</span>
          </Link>

          <Link
            href="/login"
            className={`inline-flex h-11 items-center rounded-full border-[3px] border-gray-400 px-6 text-base font-semibold transition-colors ${
              isLight
                ? "bg-white text-[#2f236f] hover:border-gray-500 hover:bg-gray-50"
                : "bg-white text-[#2f236f] hover:border-gray-300 hover:bg-[#f8f5ff]"
            }`}
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  )
}

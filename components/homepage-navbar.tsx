import Link from "next/link"
import { Rocket } from "lucide-react"

export function HomePageNavbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <Link
            href="/"
            className="flex text-3xl font-bold text-white title-font animate-fade-in flex-shrink-0 items-center gap-2.5 hover:text-gray-300 transition-colors"
          >
            <Rocket className="w-7 h-7 text-white" />
            <span className="block font-extrabold whitespace-nowrap">PLANCK</span>
          </Link>

          <Link href="/login" className="group inline-flex rounded-full bg-gradient-to-r from-[#9a7bff] via-[#d77bff] to-[#ffb56b] p-[1px]">
            <span className="inline-flex h-11 items-center rounded-full bg-white px-6 text-base font-semibold text-[#2f236f] transition-colors group-hover:bg-[#f8f5ff]">
              Sign in
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

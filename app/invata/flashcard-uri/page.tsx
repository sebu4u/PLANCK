import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { generateMetadata } from "@/lib/metadata"
import { FlashcardDeckView } from "@/components/invata/flashcard-deck-view"

export const metadata: Metadata = generateMetadata("learning-paths")

export default function FlashcardDeckPage() {
  return (
    <>
      <Navigation />
      <main className={`min-h-screen bg-[#ffffff] pt-16 burger:pt-28 burger:pb-10 ${MOBILE_BOTTOM_NAV_PADDING_CLASS}`}>
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8 lg:px-12">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
              Flashcard-urile mele
            </h1>
            <p className="mt-1.5 text-sm text-[#6d6d6d] sm:text-base">
              Revizuiește conceptele generate după dificultăți în traseele de învățare
            </p>
          </header>
          <FlashcardDeckView />
        </div>
      </main>
    </>
  )
}

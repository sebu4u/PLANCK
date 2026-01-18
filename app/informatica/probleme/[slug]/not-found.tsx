import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <Navigation />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 lg:px-12">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <h1 className="mb-4 text-3xl font-semibold text-white">Problemă negăsită</h1>
            <p className="mb-8 text-white/70">
              Problema pe care o cauți nu există sau a fost ștearsă.
            </p>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/informatica/probleme">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Înapoi la catalog
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


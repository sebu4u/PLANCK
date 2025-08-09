import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Atom, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Atom className="w-24 h-24 text-purple-300 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Problema nu a fost găsită</h1>
            <p className="text-xl text-gray-600 mb-8">
              Ne pare rău, dar problema pe care o cauți nu există sau a fost mutată.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/probleme">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Înapoi la catalog
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-purple-200 hover:border-purple-400 hover:text-purple-600">
                  Acasă
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

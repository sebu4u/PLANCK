import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AlertTriangle, Home } from "lucide-react"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <div className="pt-16">
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <AlertTriangle className="w-24 h-24 text-purple-300 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Pagina nu a fost găsită</h1>
            <p className="text-xl text-gray-600 mb-8">
              Ne pare rău, dar pagina pe care o cauți nu există sau a fost mutată.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                  <Home className="w-4 h-4 mr-2" />
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


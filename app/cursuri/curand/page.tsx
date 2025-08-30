import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { NewsletterSection } from "@/components/newsletter-section"

export default function ComingSoonCoursesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <div className="pt-16">
        <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Cursurile vor fi lansate în curând
            </h1>
            <p className="text-lg text-gray-600">
              Lucrăm intens la cursurile pentru clasa a 9-a și a 10-a. Lasă-ne emailul tău și te anunțăm imediat ce sunt disponibile.
            </p>
          </div>
        </section>
        <NewsletterSection />
      </div>
      <Footer />
    </div>
  )
}



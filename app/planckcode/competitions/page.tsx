import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PlanckCodeSidebar } from "@/components/planckcode-sidebar"
import { Button } from "@/components/ui/button"
import { generateMetadata } from "@/lib/metadata"
import { PlanckCodeContentWrapper } from "@/components/planckcode-content-wrapper"
import { Trophy, Calendar, Users, Award, Clock } from "lucide-react"

export const metadata: Metadata = generateMetadata('planckcode', {
  title: "Competiții - PlanckCode",
  description: "Participă la competiții de programare competitive pe PlanckCode. Concurează cu alți elevi și testează-ți abilitățile de programare.",
  keywords: "competiții programare, concursuri informatică, olimpiade programare, hackathoane, competiții coding",
  openGraph: {
    title: "Competiții - PlanckCode",
    description: "Participă la competiții de programare competitive pe PlanckCode.",
  },
})

export default function CompetitionsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-hidden">
      <Navigation />
      <PlanckCodeSidebar />

      {/* Hero Section */}
      <PlanckCodeContentWrapper className="pt-32 pb-12">
        <section className="space-y-6 scroll-animate-fade-up">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-white" />
            <h1 className="font-vt323 text-4xl sm:text-5xl md:text-6xl font-bold text-white">
              Competiții
            </h1>
          </div>
          <p className="font-vt323 text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-3xl">
            Testează-ți abilitățile de programare în competiții reale. Concurează cu alți elevi, câștigă premii și urcă în clasament.
          </p>
        </section>
      </PlanckCodeContentWrapper>

      {/* Upcoming Competitions Section */}
      <PlanckCodeContentWrapper className="py-12">
        <section className="space-y-8">
          <div className="flex items-center gap-3 scroll-animate-fade-up">
            <Calendar className="w-6 h-6 text-white" />
            <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Competiții Viitoare
            </h2>
          </div>

          {/* Empty State */}
          <div className="border border-white/20 rounded-3xl p-12 bg-white/5 backdrop-blur-md scroll-animate-fade-up animate-delay-200">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center">
                <Trophy className="w-12 h-12 text-gray-400" />
              </div>
              <div className="space-y-3">
                <h3 className="font-vt323 text-2xl sm:text-3xl text-white">
                  Nu există competiții programate
                </h3>
                <p className="font-vt323 text-lg sm:text-xl text-gray-400 max-w-2xl">
                  Momentan nu avem competiții anunțate. Revino curând pentru a vedea noile competiții și oportunități de a-ți testa abilitățile.
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder Structure for Future Competitions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 scroll-animate-fade-up animate-delay-400">
            {/* This structure will be used when competitions are added */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="border border-white/10 rounded-2xl p-6 bg-transparent opacity-30"
                style={{ display: 'none' }}
              >
                {/* Hidden placeholder cards for future use */}
              </div>
            ))}
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* Competition Categories Section */}
      <PlanckCodeContentWrapper className="py-12">
        <section className="space-y-8">
          <div className="scroll-animate-fade-up">
            <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Tipuri de Competiții
            </h2>
            <p className="font-vt323 text-xl text-gray-300 leading-relaxed max-w-3xl">
              În viitor, vei putea participa la diferite tipuri de competiții:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Competiții Rapide",
                description: "Competiții de scurtă durată, perfecte pentru antrenament rapid și testarea abilităților.",
              },
              {
                icon: Users,
                title: "Competiții de Echipă",
                description: "Colaborează cu alți elevi și concurează în echipe pentru a rezolva probleme complexe.",
              },
              {
                icon: Award,
                title: "Competiții Olimpice",
                description: "Competiții formale, similare cu olimpiadele naționale, cu probleme de nivel avansat.",
              },
            ].map((category, index) => {
              const Icon = category.icon
              const delayClass = index === 0 ? '' : index === 1 ? 'animate-delay-200' : 'animate-delay-400'
              return (
                <div
                  key={category.title}
                  className={`border border-white/20 rounded-2xl p-6 bg-transparent transition-all duration-300 hover:border-white hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] scroll-animate-scale ${delayClass}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-vt323 text-xl text-white">{category.title}</h3>
                  </div>
                  <p className="font-vt323 text-sm text-gray-400 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* Past Competitions Section */}
      <PlanckCodeContentWrapper className="py-12">
        <section className="space-y-8">
          <div className="flex items-center gap-3 scroll-animate-fade-up">
            <Award className="w-6 h-6 text-white" />
            <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Competiții Trecute
            </h2>
          </div>

          {/* Empty State */}
          <div className="border border-white/20 rounded-3xl p-12 bg-white/5 backdrop-blur-md scroll-animate-fade-up animate-delay-200">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center">
                <Award className="w-12 h-12 text-gray-400" />
              </div>
              <div className="space-y-3">
                <h3 className="font-vt323 text-2xl sm:text-3xl text-white">
                  Nu există competiții trecute
                </h3>
                <p className="font-vt323 text-lg sm:text-xl text-gray-400 max-w-2xl">
                  Încă nu s-au desfășurat competiții pe platformă. Fii primul care participă când vor fi anunțate!
                </p>
              </div>
            </div>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* CTA Section */}
      <PlanckCodeContentWrapper className="py-20">
        <section className="border border-white/20 rounded-3xl p-12 bg-white/5 backdrop-blur-md text-center space-y-6 scroll-animate-fade-up">
          <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Pregătește-te pentru competiții
          </h2>
          <p className="font-vt323 text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Începe să rezolvi probleme și să-ți dezvolți abilitățile de programare. Când vor fi anunțate competițiile, vei fi gata să concurezi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-200 transition-all duration-300 font-vt323 text-xl px-8 py-6"
            >
              Explorează problemele
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 font-vt323 text-xl px-8 py-6"
            >
              Vezi cursurile
            </Button>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      <PlanckCodeContentWrapper className="bg-black py-16" innerClassName="max-w-none">
        <Footer backgroundColor="bg-black" />
      </PlanckCodeContentWrapper>
    </div>
  )
}


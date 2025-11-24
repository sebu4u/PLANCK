import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PlanckCodeSidebar } from "@/components/planckcode-sidebar"
import { Button } from "@/components/ui/button"
import { generateMetadata } from "@/lib/metadata"
import { PlanckCodeContentWrapper } from "@/components/planckcode-content-wrapper"
import { BarChart3, Trophy, TrendingUp, Calendar, Users, Award } from "lucide-react"

export const metadata: Metadata = generateMetadata('planckcode', {
  title: "Leaderboards - PlanckCode",
  description: "Vezi clasamentele PlanckCode și urcă în top. Concurează cu alți elevi și urmărește-ți progresul în programarea competitivă.",
  keywords: "leaderboard, clasament, ranking, top programatori, competiție programare, ELO rating",
  openGraph: {
    title: "Leaderboards - PlanckCode",
    description: "Vezi clasamentele PlanckCode și urcă în top.",
  },
})

export default function LeaderboardsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-hidden">
      <Navigation />
      <PlanckCodeSidebar />

      {/* Hero Section */}
      <PlanckCodeContentWrapper className="pt-32 pb-12">
        <section className="space-y-6 scroll-animate-fade-up">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-white" />
            <h1 className="font-vt323 text-4xl sm:text-5xl md:text-6xl font-bold text-white">
              Leaderboards
            </h1>
          </div>
          <p className="font-vt323 text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-3xl">
            Vezi unde te afli în clasament și concurează cu cei mai buni programatori. Urcă în top rezolvând probleme și câștigând ELO.
          </p>
        </section>
      </PlanckCodeContentWrapper>

      {/* Overall Leaderboard Section */}
      <PlanckCodeContentWrapper className="py-12">
        <section className="space-y-8">
          <div className="flex items-center gap-3 scroll-animate-fade-up">
            <Trophy className="w-6 h-6 text-white" />
            <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Clasament General
            </h2>
          </div>

          {/* Empty State */}
          <div className="border border-white/20 rounded-3xl p-12 bg-white/5 backdrop-blur-md scroll-animate-fade-up animate-delay-200">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center">
                <BarChart3 className="w-12 h-12 text-gray-400" />
              </div>
              <div className="space-y-3">
                <h3 className="font-vt323 text-2xl sm:text-3xl text-white">
                  Clasamentul este în construcție
                </h3>
                <p className="font-vt323 text-lg sm:text-xl text-gray-400 max-w-2xl">
                  Clasamentul general va fi disponibil în curând. Începe să rezolvi probleme pentru a-ți construi ELO-ul și a urca în top când va fi activat.
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder Structure for Future Leaderboard */}
          <div className="border border-white/15 rounded-3xl p-6 bg-white/5 backdrop-blur-md overflow-hidden scroll-animate-fade-up animate-delay-400" style={{ display: 'none' }}>
            <div className="space-y-3">
              {/* Hidden placeholder for future leaderboard entries */}
            </div>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* Leaderboard Types Section */}
      <PlanckCodeContentWrapper className="py-12">
        <section className="space-y-8">
          <div className="scroll-animate-fade-up">
            <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Tipuri de Clasamente
            </h2>
            <p className="font-vt323 text-xl text-gray-300 leading-relaxed max-w-3xl">
              În viitor, vei putea urmări diferite tipuri de clasamente:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Trophy,
                title: "Clasament General",
                description: "Clasamentul general bazat pe ELO și performanță totală. Urcă în top rezolvând probleme și câștigând puncte.",
              },
              {
                icon: Calendar,
                title: "Clasament Săptămânal",
                description: "Competiție săptămânală pentru a vedea cine a avut cea mai bună performanță în ultimele 7 zile.",
              },
              {
                icon: TrendingUp,
                title: "Clasament Lunar",
                description: "Topul celor mai activi și performanți programatori din luna curentă. Resetează la începutul fiecărei luni.",
              },
              {
                icon: Users,
                title: "Clasament pe Categorii",
                description: "Clasamente separate pentru diferite categorii de probleme: algoritmi, structuri de date, matematică și multe altele.",
              },
              {
                icon: Award,
                title: "Clasament Competiții",
                description: "Clasamente dedicate pentru fiecare competiție. Vezi rezultatele și pozițiile după fiecare competiție.",
              },
              {
                icon: BarChart3,
                title: "Clasament Probleme Rezolvate",
                description: "Topul utilizatorilor cu cele mai multe probleme rezolvate. Măsoară consistența și dedicarea.",
              },
            ].map((category, index) => {
              const Icon = category.icon
              const delayClass = index === 0 ? '' : index === 1 ? 'animate-delay-100' : index === 2 ? 'animate-delay-200' : index === 3 ? 'animate-delay-300' : index === 4 ? 'animate-delay-400' : 'animate-delay-600'
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

      {/* How It Works Section */}
      <PlanckCodeContentWrapper className="py-12">
        <section className="space-y-8">
          <div className="scroll-animate-fade-up">
            <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Cum Funcționează
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Rezolvă Probleme",
                description: "Rezolvă probleme de programare pentru a câștiga ELO și puncte.",
              },
              {
                step: "2",
                title: "Câștigă ELO",
                description: "Fiecare problemă rezolvată corect îți crește ELO-ul și te propulsează în clasament.",
              },
              {
                step: "3",
                title: "Urcă în Rank",
                description: "Cu ELO mai mare, urci în rank-uri superioare: Bronze, Silver, Gold, Platinum și multe altele.",
              },
              {
                step: "4",
                title: "Concurează",
                description: "Urmărește-ți poziția în clasament și concurează cu alți elevi pentru locul de top.",
              },
            ].map((item, index) => {
              const delayClass = index === 0 ? '' : index === 1 ? 'animate-delay-200' : index === 2 ? 'animate-delay-400' : 'animate-delay-600'
              return (
                <div
                  key={item.step}
                  className={`border border-white/20 rounded-2xl p-6 bg-transparent transition-all duration-300 hover:border-white hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] scroll-animate-scale ${delayClass}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                      <span className="font-vt323 text-2xl font-bold text-white">{item.step}</span>
                    </div>
                    <h3 className="font-vt323 text-xl text-white">{item.title}</h3>
                  </div>
                  <p className="font-vt323 text-sm text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* CTA Section */}
      <PlanckCodeContentWrapper className="py-20">
        <section className="border border-white/20 rounded-3xl p-12 bg-white/5 backdrop-blur-md text-center space-y-6 scroll-animate-fade-up">
          <h2 className="font-vt323 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Începe să urci în clasament
          </h2>
          <p className="font-vt323 text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Rezolvă probleme, câștigă ELO și urcă în top. Clasamentul va fi activat în curând - fii pregătit!
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
              Vezi profilul meu
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


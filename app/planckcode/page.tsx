import { Metadata } from "next"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PlanckCodeSidebar } from "@/components/planckcode-sidebar"
import { Button } from "@/components/ui/button"
import { generateMetadata } from "@/lib/metadata"
import PlanckCodeIDEShowcase from "@/components/planckcode-ide-showcase"
import { PlanckCodeContentWrapper } from "@/components/planckcode-content-wrapper"
import SplitText from "@/components/SplitText"
import { LearningPathSection } from "@/components/planckcode/LearningPath"

export const metadata: Metadata = generateMetadata('planckcode')

export default function PlanckCodePage() {
  const sampleProblems = [
    { title: 'Fluxul Neutronului', difficulty: 'Medie', description: 'Calculează traseul optim pentru particule într-o rețea cubică.' },
    { title: 'Compresorul de Date', difficulty: 'Ușoară', description: 'Optimizează fluxul de mesaje printr-un algoritm greedy.' },
    { title: 'Labirintul cu Teleportare', difficulty: 'Greu', description: 'Determină costul minim pe o hartă cu portaluri bidirecționale.' },
    { title: 'Scheduler Cuantic', difficulty: 'Medie', description: 'Planifică procese paralele folosind ferestre dinamice de timp.' },
  ]

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-hidden">
      <Navigation />
      <PlanckCodeSidebar />

      {/* Hero Section */}
      <PlanckCodeContentWrapper className="pt-0" innerClassName="max-w-none" flush>
        <section className="relative flex items-center justify-start overflow-hidden min-h-screen">
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/videos/planckcode-background.mp4" type="video/mp4" />
          </video>

          {/* Content */}
          <div className="relative z-10 max-w-4xl px-6 sm:px-10 mt-16 md:mt-20">
            <h1 className="scroll-animate-fade-up font-vt323 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              <span className="block">Code smarter. Learn faster.</span>
              <span className="block">That's PlanckCode.</span>
            </h1>
            
            <p className="scroll-animate-fade-up animate-delay-200 font-vt323 text-lg sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
              IDE online integrat + Online Judge care evaluează automat soluțiile + cursuri clare de C++ pentru liceeni. Totul într-un singur loc, proiectat pentru învățare rapidă și competiții.
            </p>

            {/* CTA Buttons */}
            <div className="scroll-animate-fade-up animate-delay-400 flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-200 transition-all duration-300 font-vt323 text-lg sm:text-xl px-8 py-6 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
              >
                <Link href="/planckcode/ide">
                  Începe gratuit
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-transparent border-white text-white hover:bg-white hover:text-black transition-all duration-300 font-vt323 text-lg sm:text-xl px-8 py-6 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
              >
                <Link href="/planckcode/learn">
                  Vezi cursurile de C++
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* IDE Showcase Section */}
      <div className="hidden md:block">
        <PlanckCodeIDEShowcase />
      </div>

      {/* Problems CTA Section */}
      <PlanckCodeContentWrapper className="pt-10 pb-20">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
          <div className="space-y-6 font-vt323 scroll-animate-fade-left">
            <p className="uppercase text-sm tracking-[0.3em] text-gray-400">Online Judge</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Probleme noi în fiecare săptămână.
              <span className="block text-gray-300">Antrenament pentru olimpiade și hackathoane.</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Rulezi direct în browser, vezi feedback instant și salvezi soluțiile în cont. Îți măsurăm progresul, tu doar scrii cod.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-vt323 text-xl px-8 py-6">
                Deschide setul de probleme
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-transparent border border-white text-white hover:bg-white/10 font-vt323 text-xl px-8 py-6"
              >
                <Link href="/planckcode/leaderboards">
                  Vezi leaderboard
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-vt323 scroll-animate-fade-right">
            {sampleProblems.map((problem, index) => (
              <div
                key={problem.title}
                className={`border border-white/20 rounded-2xl p-6 bg-transparent transition-all duration-300 hover:border-white hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] scroll-animate-scale ${index === 0 ? '' : index === 1 ? 'animate-delay-200' : index === 2 ? 'animate-delay-400' : 'animate-delay-600'}`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">{problem.difficulty}</p>
                <h3 className="text-xl text-white mb-3">{problem.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* AI Coding Agent Section */}
      <PlanckCodeContentWrapper className="py-20">
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <SplitText
              text="Your AI Coding Agent"
              tag="h2"
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
            <p className="scroll-animate-fade-up animate-delay-200 font-vt323 text-xl sm:text-2xl text-gray-300">Mentorul tău inteligent pentru programare, explicat clar și rapid.</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 items-stretch">
            <div className="scroll-animate-fade-left font-vt323 text-lg text-gray-300 leading-relaxed border border-white/15 rounded-3xl p-8 bg-white/5 backdrop-blur-md">
              Agentul PlanckCode îți analizează codul, găsește bug-uri, explică soluții pas cu pas și te ajută să înțelegi algoritmi, structuri de date și logică de concurs.
              <br /><br />
              Nu doar răspunde — predă, corectează și optimizează, la nivelul tău.
            </div>
            <div className="scroll-animate-fade-right border border-white/15 rounded-3xl p-4 bg-white/5 backdrop-blur-md flex items-center justify-center overflow-hidden">
              <img 
                src="/images/planckcode-ai-agent-1.jpg" 
                alt="PlanckCode AI Agent" 
                className="w-full h-[260px] object-cover rounded-2xl"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-gradient-radial from-blue-500/20 via-indigo-500/10 to-transparent"></div>
            <div className="relative flex flex-col gap-6 items-center">
              {[
                { text: "Rezolvă probleme împreună cu tine, nu în locul tău", align: "self-center lg:self-start lg:-translate-x-16" },
                { text: "Îți explică orice concept din C++ pe limba ta", align: "self-center lg:self-end lg:translate-x-16" },
                { text: "Găsește erori și îți arată exact ce trebuie schimbat", align: "self-center lg:self-center" },
                { text: "Sugerează optimizări și complexități", align: "self-center lg:self-start lg:-translate-x-8" },
                { text: "Îți poate genera test cases, edge cases și inputuri random", align: "self-center lg:self-end lg:translate-x-12" },
                { text: "Funcționează direct în IDE, în timp real", align: "self-center lg:self-center" },
              ].map((bullet, index) => {
                const delayClass = index === 0 ? '' : index === 1 ? 'animate-delay-100' : index === 2 ? 'animate-delay-200' : index === 3 ? 'animate-delay-300' : index === 4 ? 'animate-delay-400' : 'animate-delay-600';
                return (
                  <div
                    key={bullet.text}
                    className={`scroll-animate-fade-up ${delayClass} border border-white/20 rounded-2xl bg-transparent px-4 py-3 transition-all duration-300 hover:border-white hover:bg-white/5 hover:-translate-y-1 hover:shadow-[0_6px_18px_rgba(255,255,255,0.08)] max-w-2xl w-full ${bullet.align}`}
                  >
                    <p className="font-vt323 text-sm sm:text-base text-gray-200 text-center">
                      {bullet.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="relative scroll-animate-fade-left">
              <div className="absolute inset-x-0 bottom-[-60px] h-48 bg-gradient-radial from-orange-500/40 via-orange-400/15 to-transparent blur-3xl pointer-events-none"></div>
              <div className="border border-white/15 rounded-3xl p-4 bg-white/5 backdrop-blur-md flex items-center justify-center relative z-[1] overflow-hidden">
                <img 
                  src="/images/planckcode-ai-agent-2.jpg" 
                  alt="PlanckCode AI Agent Training" 
                  className="w-full h-[260px] object-cover rounded-2xl"
                />
              </div>
            </div>
            <div className="scroll-animate-fade-right font-vt323 space-y-6 text-gray-300 text-lg leading-relaxed">
              <p className="text-2xl text-white">Nu este un „AI care scrie cod".</p>
              <p>Este un partener de antrenament pentru olimpiade, proiecte și învățare rapidă.</p>
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-100 font-vt323 text-xl px-8 py-6"
              >
                <Link href="/planckcode/ide?agent=open">
                  Activează Agentul PlanckCode
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      <PlanckCodeContentWrapper>
        <LearningPathSection />
      </PlanckCodeContentWrapper>

      {/* Testimonials Section */}
      <PlanckCodeContentWrapper className="py-20">
        <section className="space-y-16">
          <div className="text-center relative">
            <div className="absolute inset-x-0 bottom-[-60px] h-48 bg-gradient-radial from-orange-500/40 via-orange-400/15 to-transparent blur-3xl pointer-events-none"></div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white scroll-animate-fade-up relative z-[1]">
              Trusted by Performers. Proven by Results.
            </h2>
          </div>

          {/* First Testimonial - Image Left, Text Right */}
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="flex items-center justify-center scroll-animate-fade-left animate-delay-200">
              <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg">
                <img 
                  src="/images/planckcode-testimonial-1.jpg" 
                  alt="Lucian C. - Olimpic Național la Informatică" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="scroll-animate-fade-right animate-delay-200 font-vt323 space-y-4 text-gray-300 text-lg leading-relaxed">
              <p className="italic text-xl sm:text-2xl text-white">
                "PlanckCode mi-a redus timpul de pregătire la jumătate. E primul IDE online în care chiar pot scrie, rula și testa cod ca la concurs. Nu mai pierd timp cu setup-uri. Doar intru și lucrez."
              </p>
              <p className="text-base text-gray-400">
                — Lucian C. , Olimpic Național la Informatică
              </p>
            </div>
          </div>

          {/* Second Testimonial - Image Right, Text Left */}
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="scroll-animate-fade-left animate-delay-400 font-vt323 space-y-4 text-gray-300 text-lg leading-relaxed order-2 lg:order-1">
              <p className="italic text-xl sm:text-2xl text-white">
                "PlanckCode isn't just convenient — it accelerates improvement. În doar două săptămâni am trecut de la probleme simple la dinamici avansate. Platforma chiar te împinge înainte."
              </p>
              <p className="text-base text-gray-400">
                — Bianca P., elevă de liceu
              </p>
            </div>
            <div className="flex items-center justify-center order-1 lg:order-2 scroll-animate-fade-right animate-delay-400">
              <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg">
                <img 
                  src="/images/planckcode-testimonial-2.jpg" 
                  alt="Bianca P. - elevă de liceu" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* Leaderboard Section */}
      <PlanckCodeContentWrapper className="py-20">
        <section className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Leaderboard */}
          <div className="relative scroll-animate-fade-left">
            <div className="border border-white/15 rounded-3xl p-6 bg-white/5 backdrop-blur-md overflow-hidden">
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'Alex M.', score: 2847, elo: 1850 },
                  { rank: 2, name: 'Maria P.', score: 2653, elo: 1720 },
                  { rank: 3, name: 'Andrei C.', score: 2512, elo: 1650 },
                  { rank: 4, name: 'Elena D.', score: 2389, elo: 1580 },
                  { rank: 5, name: 'Radu T.', score: 2245, elo: 1520 },
                ].map((entry, index) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 scroll-animate-scale ${index === 0 ? '' : index === 1 ? 'animate-delay-100' : index === 2 ? 'animate-delay-200' : index === 3 ? 'animate-delay-300' : 'animate-delay-400'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                        entry.rank === 3 ? 'bg-amber-600/20 text-amber-400' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-vt323 text-white text-lg">{entry.name}</p>
                        <p className="font-vt323 text-gray-400 text-sm">ELO: {entry.elo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-vt323 text-white text-lg font-bold">{entry.score}</p>
                      <p className="font-vt323 text-gray-400 text-xs">points</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Gradient fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Text Content */}
          <div className="scroll-animate-fade-right space-y-6 font-vt323">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white">
              Step into the arena.
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              PlanckCode îți arată exact unde te afli — nu prin păreri, ci prin performanță reală. Fiecare problemă rezolvată, fiecare test trecut și fiecare linie de cod corectă te propulsează în clasament.
            </p>
            <p className="text-xl text-gray-300 leading-relaxed">
              Concurezi cu elevi din toată țara, de la începători până la olimpici. Vezi cine te depășește, pe cine depășești și cât ai avansat față de ieri.
            </p>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* Ranks Section */}
      <PlanckCodeContentWrapper className="py-20">
        <section className="space-y-12">
          <div className="text-center scroll-animate-fade-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              Câștigi puncte. Urci în rank.
            </h2>
          </div>

          {/* Ranks Horizontal */}
          <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 scroll-animate-fade-up animate-delay-200">
            {[
              { name: 'Bronze' },
              { name: 'Silver' },
              { name: 'Gold' },
              { name: 'Platinum' },
              { name: 'Diamond' },
              { name: 'Master' },
              { name: 'Ascendant' },
              { name: 'Singularity' },
            ].map((rank, index) => (
              <div key={rank.name} className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <span className="font-vt323 text-sm sm:text-base lg:text-lg font-bold text-white">
                  {rank.name}
                </span>
                {index < 7 && (
                  <span className="text-white/40 text-base sm:text-lg lg:text-xl">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Circular Rank Images with Arrow */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 lg:gap-16 scroll-animate-fade-up animate-delay-400">
            <div className="scroll-animate-scale w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full border-2 border-white/30 bg-white/5 flex items-center justify-center overflow-hidden">
              <img 
                src="/ranks/bronze.png" 
                alt="Bronze Rank" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="text-white/60 text-2xl sm:text-3xl lg:text-4xl">→</div>
            <div className="relative scroll-animate-scale animate-delay-200">
              <div className="absolute inset-0 bg-gradient-radial from-blue-500/40 via-purple-500/30 to-transparent blur-2xl rounded-full pointer-events-none"></div>
              <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full border-2 border-white/30 bg-white/5 flex items-center justify-center relative z-[1] overflow-hidden">
                <img 
                  src="/ranks/singularity.png" 
                  alt="Singularity Rank" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-center scroll-animate-fade-up animate-delay-600">
            <p className="font-vt323 text-gray-400 text-lg sm:text-xl lg:text-2xl">
              Fiecare nivel câștigat e o dovadă că devii mai bun.
            </p>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      {/* Final CTA Section */}
      <PlanckCodeContentWrapper className="pt-0" innerClassName="max-w-none" flush>
        <section className="relative flex items-center justify-center overflow-hidden min-h-screen">
          {/* Background Image */}
          <div 
            className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/images/planckcode-cta-background.jpg)' }}
          >
            <div className="absolute inset-0 bg-black/60"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-4xl px-6 sm:px-10 text-center">
            <h2 className="scroll-animate-fade-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Ready to code your way to the top?
            </h2>
            <p className="scroll-animate-fade-up animate-delay-200 font-vt323 text-xl sm:text-2xl md:text-3xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
              Join thousands of students already mastering competitive programming on PlanckCode. Start coding, start competing, start winning.
            </p>
            <div className="scroll-animate-fade-up animate-delay-400 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild
                size="lg" 
                className="bg-white text-black hover:bg-gray-200 transition-all duration-300 font-vt323 text-xl sm:text-2xl px-10 py-7"
              >
                <Link href="/planckcode/ide">
                  Începe acum gratuit
                </Link>
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 font-vt323 text-xl sm:text-2xl px-10 py-7"
              >
                Explorează problemele
              </Button>
            </div>
            <p className="scroll-animate-fade-up animate-delay-600 font-vt323 text-base sm:text-lg text-gray-400 mt-8">
              Fără card de credit. Fără obligații. Doar cod și progres.
            </p>
          </div>
        </section>
      </PlanckCodeContentWrapper>

      <PlanckCodeContentWrapper className="bg-black py-16" innerClassName="max-w-none">
        <Footer backgroundColor="bg-black" />
      </PlanckCodeContentWrapper>
    </div>
  )
}

"use client"

export default function InsightBenefitsSection() {
  return (
    <section className="relative py-12 sm:py-24 px-4 sm:px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          {/* Left side - Title and subtext */}
          <div className="space-y-4 sm:space-y-8">
            <h2 className="scroll-animate-fade-up text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              Învață mai <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">rapid</span>. Înțelege mai <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">profund</span>.
            </h2>
            <p className="scroll-animate-fade-up animate-delay-200 text-base sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-bold">
              Insight nu îți oferă doar răspunsuri, ci te învață să gândești critic. Cu explicații pas cu pas și răbdare nelimitată, îți dezvoltă logica și încrederea în tine.
            </p>
          </div>

          {/* Right side - 3 bullet points */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-3 top-6 bottom-6 w-px bg-gray-400"></div>
            
            <div className="space-y-6 sm:space-y-8">
              {/* Bullet 1 */}
              <div className="flex gap-4 sm:gap-6 relative scroll-animate-fade-right">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-400 rounded-full border-2 border-gray-400 flex items-center justify-center relative z-10">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-300 mb-2 sm:mb-3">
                    Învățare activă
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Insight nu îți oferă direct răspunsurile, ci te provoacă să gândești. Îți pune întrebările potrivite și te ghidează pas cu pas până găsești singur soluția. Înveți să raționezi logic și să înțelegi cu adevărat conceptele.
                  </p>
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="flex gap-4 sm:gap-6 relative scroll-animate-fade-right animate-delay-200">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-400 rounded-full border-2 border-gray-400 flex items-center justify-center relative z-10">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-300 mb-2 sm:mb-3">
                    Explicații detaliate
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Când întâmpini o dificultate, Insight îți explică totul pe înțelesul tău. Fiecare pas e justificat și conectat cu ce ai învățat anterior. Primești o învățare structurată și coerentă, ca de la un profesor care te cunoaște personal.
                  </p>
                </div>
              </div>

              {/* Bullet 3 */}
              <div className="flex gap-4 sm:gap-6 relative scroll-animate-fade-right animate-delay-400">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-400 rounded-full border-2 border-gray-400 flex items-center justify-center relative z-10">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-300 mb-2 sm:mb-3">
                    Ajutor 24/7
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Poți apela la Insight oricând — dimineața înainte de școală, seara înainte de test sau în weekend. AI-ul e mereu disponibil, răbdător și precis, oferindu-ți explicații clare în câteva secunde. Studiul devine mai liber și fără stres.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

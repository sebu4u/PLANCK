import { Card, CardContent } from "@/components/ui/card"

export function AboutPlanckSection() {
  return (
    <section className="py-16 sm:py-20 px-4 max-w-7xl mx-auto lg:py-6">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Left Side - Title and Developers */}
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in-up lg:text-8xl py-7 text-left mx-20">
            Ce este PLANCK?
          </h2>

          {/* Developers Section */}
          <div className="relative animate-fade-in-up-delay scale-125 mt-56">
            <div className="flex items-center justify-center relative my-6 flex-row">
              {/* First Developer */}
              <div className="relative z-10 transform -translate-x-4 -translate-y-2 flex flex-col items-center">
                <div className="relative">
                  <img
                    src="https://i.ibb.co/0RKyZ5jj/DSC02304.jpg"
                    alt="Mițurcă Sebastian"
                    className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-lg object-cover cosmic-glow"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🏆</span>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Mițurcă Sebastian</h4>
                  <p className="text-xs sm:text-sm text-purple-600 font-medium">Premiant Olimpiada Națională</p>
                  <p className="text-xs text-gray-500">de Fizică</p>
                </div>
              </div>

              {/* Second Developer */}
              <div className="relative z-10 transform translate-x-4 translate-y-2 flex flex-col items-center">
                <div className="relative">
                  <img
                    src="https://i.ibb.co/JRktCngW/Whats-App-Image-2025-06-15-at-22-05-38-efacef2e.jpg"
                    alt="Avram Marina"
                    className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-lg object-cover cosmic-glow"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🔬</span>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <h4 className="font-semibold text-gray-900 text-sm:text-base">Avram Marina</h4>
                  <p className="text-xs sm:text-sm text-blue-600 font-medium">Premianta Concursuri</p>
                  <p className="text-xs text-gray-500">Cercetare Științifică</p>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full opacity-20 -z-10"></div>
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div
              className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-pink-400 rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>

        {/* Right Side - Description */}
        <div className="lg:pt-8 animate-fade-in-up-delay-2">
          <Card className="border-purple-200 hover:border-purple-400 transition-all duration-300 space-card bg-gradient-to-br from-white to-purple-50/30">
            <CardContent className="p-6 sm:p-8 sm:py-11">
              <div className="space-y-6 text-gray-700 leading-relaxed font-medium">
                <p className="text-xl font-medium">
                  <span className="font-semibold text-purple-600">PLANCK</span> este o inițiativă creată de{" "}
                  <span className="font-medium text-gray-900">elevi olimpici de fizică</span>, ca răspuns la lipsa de
                  profesori calificați din sistem.
                </p>

                <p className="text-xl">
                  Oferim <span className="font-medium text-gray-900">cursuri video premium</span> pentru clasele a IX-a
                  și a X-a, plus o{" "}
                  <span className="font-medium text-gray-900">bancă completă de probleme gratuite</span> cu rezolvări
                  detaliate.
                </p>

                <p className="text-xl">
                  La <span className="font-semibold text-purple-600">PLANCK</span>, fizica devine{" "}
                  <span className="font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    accesibilă, logică și captivantă
                  </span>
                  . Suntem aici să te îndrumăm de la primul concept până la ultimul exercițiu, transformând fiecare
                  provocare într-o oportunitate de învățare.
                </p>
              </div>

              {/* Stats or highlights */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-purple-100">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    2+
                  </div>
                  <div className="text-xs text-gray-600">Ani experiență</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    100+
                  </div>
                  <div className="text-xs text-gray-600">Ore conținut</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    500+
                  </div>
                  <div className="text-xs text-gray-600">Probleme</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="animate-fade-in-up-delay-3 mb-3 mt-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-black dark:text-white mb-4">Ce spun studenții</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Mii de studenți și-au îmbunătățit performanțele cu PLANCK
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[hsl(348,83%,47%)] transition-colors rounded-lg p-6">
            <div className="flex items-center gap-1 mb-4">
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
              "PLANCK m-a ajutat să înțeleg fizica mult mai bine. Explicațiile sunt clare și problemele sunt foarte bine
              organizate."
            </p>

            <div className="flex items-center gap-3">
              <img
                src="/placeholder.svg?height=40&width=40"
                alt="Ana Popescu"
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
              />
              <div>
                <div className="text-black dark:text-white font-medium">Ana Popescu</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Clasa a 10-a</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[hsl(348,83%,47%)] transition-colors rounded-lg p-6">
            <div className="flex items-center gap-1 mb-4">
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
              "Cursurile video sunt fantastice! Am reușit să îmi îmbunătățesc notele la fizică considerabil."
            </p>

            <div className="flex items-center gap-3">
              <img
                src="/placeholder.svg?height=40&width=40"
                alt="Mihai Ionescu"
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
              />
              <div>
                <div className="text-black dark:text-white font-medium">Mihai Ionescu</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Clasa a 9-a</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[hsl(348,83%,47%)] transition-colors rounded-lg p-6">
            <div className="flex items-center gap-1 mb-4">
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <svg
                className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
              "Platforma PLANCK mi-a fost de mare ajutor în pregătirea pentru BAC. Recomand cu încredere!"
            </p>

            <div className="flex items-center gap-3">
              <img
                src="/placeholder.svg?height=40&width=40"
                alt="Elena Dumitrescu"
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
              />
              <div>
                <div className="text-black dark:text-white font-medium">Elena Dumitrescu</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Absolventă</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

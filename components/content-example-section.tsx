import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LazyYouTubePlayer, extractYouTubeVideoId } from "@/components/lazy-youtube-player"

export function ContentExampleSection() {
  return (
    <section className="py-8 lg:py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Moving stars */}
        <div className="absolute top-10 left-20 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
        <div
          className="absolute top-32 right-32 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-40 w-1 h-1 bg-purple-300 rounded-full opacity-70 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-60 right-60 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-40 animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>

        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-300 rounded-full opacity-40 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-3 h-3 bg-pink-300 rounded-full opacity-30 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-50 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Geometric shapes */}
        <div
          className="absolute top-20 left-1/4 w-16 h-16 border border-purple-200 rounded-lg opacity-20 rotate-12 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/4 w-12 h-12 border border-pink-200 rounded-full opacity-25 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8 animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Vezi cum funcționează
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Un exemplu rapid de problemă rezolvată pe PLANCK.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mt-4 animate-expand"></div>
        </div>

        {/* Main Content - Mobile: Stacked, Desktop: Side by Side */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Video Card - Left on Desktop */}
          <div className="mb-6 lg:mb-0 animate-fade-in-up">
            <Card className="bg-white border-purple-200 hover:border-purple-400 transition-all duration-300 space-card shadow-xl">
              <CardContent className="p-4 lg:p-6">
                {/* Card Title */}
                <div className="text-center mb-4">
                  <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Problema zilei</h3>
                </div>

                {/* YouTube Video with Lazy Loading */}
                <div className="relative w-full">
                  <LazyYouTubePlayer
                    videoId="QBTWRag_3Ls"
                    title="Problema zilei - PLANCK"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content - Right on Desktop */}
          <div className="lg:text-left text-center animate-fade-in-up-delay">
            <div className="space-y-6">
              <div className="hidden lg:block">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Învață fizica cu exemple practice
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Fiecare problemă vine cu explicații pas cu pas și rezolvări video detaliate. 
                  Învață conceptele cheie prin exemple concrete și aplicări practice.
                </p>
              </div>

              <div className="space-y-3 hidden lg:block">
                <div className="flex items-center gap-3 lg:justify-start justify-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700">Explicații pas cu pas</span>
                </div>
                <div className="flex items-center gap-3 lg:justify-start justify-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700">Rezolvări video interactive</span>
                </div>
                <div className="flex items-center gap-3 lg:justify-start justify-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700">Progres personalizat</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Link href="/probleme/M007">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 cosmic-glow shadow-lg hover:shadow-xl"
                  >
                    Vezi problema
                  </Button>
                </Link>
              </div>

              {/* Bottom Text */}
              <p className="text-gray-600 pt-2 hidden lg:block">
                Ai acces la sute de probleme explicate pas cu pas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

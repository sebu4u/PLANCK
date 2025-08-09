import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Award, Target, Rocket, Zap, Heart, Star, Trophy, Brain } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Moving stars */}
            <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
            <div
              className="absolute top-32 right-32 w-1.5 h-1.5 bg-purple-200 rounded-full opacity-50 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute bottom-40 left-40 w-1 h-1 bg-pink-200 rounded-full opacity-70 animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-60 right-60 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse"
              style={{ animationDelay: "3s" }}
            ></div>

            {/* Floating particles */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full opacity-40 animate-float"></div>
            <div
              className="absolute top-40 right-20 w-3 h-3 bg-purple-200 rounded-full opacity-30 animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-pink-200 rounded-full opacity-50 animate-float"
              style={{ animationDelay: "4s" }}
            ></div>

            {/* Gradient orbs */}
            <div
              className="absolute top-16 right-16 w-32 h-32 bg-gradient-to-br from-white/10 to-purple-300/20 rounded-full opacity-20 animate-pulse-scale"
              style={{ animationDelay: "3s" }}
            ></div>
            <div
              className="absolute bottom-20 left-16 w-24 h-24 bg-gradient-to-br from-pink-300/20 to-white/10 rounded-full opacity-25 animate-pulse-scale"
              style={{ animationDelay: "1.5s" }}
            ></div>
          </div>

          <div className="relative max-w-7xl mx-auto text-center text-white z-10">
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Rocket className="w-8 h-8 text-yellow-400" />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold cosmic-text-glow">Despre PLANCK</h1>
              </div>
              <p className="text-xl sm:text-2xl text-purple-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Suntem o echipă pasionată de fizică și educație, dedicată să facă învățarea fizicii
                <span className="text-yellow-300 font-semibold"> accesibilă și captivantă</span> pentru toți liceenii
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto animate-expand"></div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4 max-w-7xl mx-auto relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
            <div
              className="absolute bottom-40 right-40 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-60 right-20 w-1 h-1 bg-purple-300 rounded-full opacity-70 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-purple-600" />
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Misiunea noastră
                </h2>
              </div>
              <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                <p>
                  <strong className="text-purple-600">PLANCK</strong> a fost creată cu scopul de a transforma modul în
                  care studenții învață fizica. Credem că fizica nu trebuie să fie o materie temută, ci o{" "}
                  <span className="font-semibold text-gray-900">aventură fascinantă</span> în înțelegerea universului.
                </p>
                <p>
                  Prin <span className="font-semibold text-purple-600">cursuri video interactive</span>, probleme bine
                  structurate și explicații clare, ajutăm mii de studenți să-și depășească limitele și să obțină
                  rezultate excelente la fizică.
                </p>
                <p>
                  Echipa noastră este formată din <span className="font-semibold text-pink-600">elevi olimpici</span> și
                  pasionați de educație, care înțeleg provocările cu care se confruntă studenții și oferă soluții
                  practice și eficiente.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 animate-fade-in-up-delay">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400 transition-all duration-300 space-card">
                <CardContent className="p-6 text-center">
                  <Users className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-purple-700 mb-2">2500+</div>
                  <div className="text-gray-600 font-medium">Studenți activi</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:border-pink-400 transition-all duration-300 space-card">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-10 h-10 text-pink-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-pink-700 mb-2">500+</div>
                  <div className="text-gray-600 font-medium">Probleme rezolvate</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:border-green-400 transition-all duration-300 space-card">
                <CardContent className="p-6 text-center">
                  <Award className="w-10 h-10 text-green-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-green-700 mb-2">96%</div>
                  <div className="text-gray-600 font-medium">Rata de succes</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-400 transition-all duration-300 space-card">
                <CardContent className="p-6 text-center">
                  <Star className="w-10 h-10 text-yellow-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-yellow-700 mb-2">4.9</div>
                  <div className="text-gray-600 font-medium">Rating mediu</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-20 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
            <div
              className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-300 rounded-full opacity-70 animate-pulse"
              style={{ animationDelay: "3s" }}
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

          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-purple-600" />
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Echipa PLANCK
                </h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Suntem o echipă tânără și dinamică, formată din elevi olimpici pasionați de fizică și educație
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {/* Sebastian */}
              <Card className="bg-white border-purple-200 hover:border-purple-400 transition-all duration-300 space-card animate-fade-in-up">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-6">
                    <img
                      src="https://i.ibb.co/0RKyZ5jj/DSC02304.jpg"
                      alt="Mițurcă Sebastian"
                      className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-lg object-cover mx-auto cosmic-glow"
                    />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Mițurcă Sebastian</h3>
                  <p className="text-purple-600 font-semibold mb-2">Co-fondator & Dezvoltator</p>
                  <p className="text-sm text-gray-600 mb-4">Premiant Olimpiada Națională de Fizică</p>
                  <p className="text-gray-700 leading-relaxed">
                    Pasionat de fizică teoretică și programare, Sebastian aduce expertise-ul olimpic în dezvoltarea
                    conținutului educațional și a platformei PLANCK.
                  </p>
                </CardContent>
              </Card>

              {/* Marina */}
              <Card className="bg-white border-pink-200 hover:border-pink-400 transition-all duration-300 space-card animate-fade-in-up-delay">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-6">
                    <img
                      src="https://i.ibb.co/JRktCngW/Whats-App-Image-2025-06-15-at-22-05-38-efacef2e.jpg"
                      alt="Avram Marina"
                      className="w-32 h-32 rounded-full border-4 border-pink-200 shadow-lg object-cover mx-auto cosmic-glow"
                    />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Avram Marina</h3>
                  <p className="text-pink-600 font-semibold mb-2">Co-fondator & Content Creator</p>
                  <p className="text-sm text-gray-600 mb-4">Premianta Concursuri Cercetare Științifică</p>
                  <p className="text-gray-700 leading-relaxed">
                    Specializată în cercetare și metodologii educaționale, Marina creează conținutul didactic și
                    dezvoltă strategiile de învățare pentru PLANCK.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 max-w-7xl mx-auto relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-300 rounded-full opacity-40 animate-float"></div>
            <div
              className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-50 animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-1/2 right-1/4 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="text-center mb-16 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Heart className="w-8 h-8 text-purple-600" />
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Valorile noastre
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Principiile care ne ghidează în misiunea de a face fizica accesibilă tuturor
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400 transition-all duration-300 space-card animate-fade-in-up">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 cosmic-glow">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Educație de calitate</h3>
                <p className="text-gray-700 leading-relaxed">
                  Oferim conținut educațional de înaltă calitate, verificat de experți și adaptat curriculei școlare.
                  Fiecare lecție este atent planificată pentru maximizarea înțelegerii.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:border-green-400 transition-all duration-300 space-card animate-fade-in-up-delay">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 cosmic-glow">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Comunitate</h3>
                <p className="text-gray-700 leading-relaxed">
                  Construim o comunitate de studenți pasionați de fizică, unde fiecare poate învăța și se poate
                  dezvolta. Încurajăm colaborarea și sprijinul reciproc.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400 transition-all duration-300 space-card animate-fade-in-up-delay-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 cosmic-glow">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Rezultate</h3>
                <p className="text-gray-700 leading-relaxed">
                  Ne concentrăm pe rezultate concrete - îmbunătățirea notelor și înțelegerea profundă a conceptelor de
                  fizică. Succesul studenților este prioritatea noastră.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 text-white relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-40 animate-float"></div>
            <div
              className="absolute bottom-20 right-20 w-1.5 h-1.5 bg-purple-200 rounded-full opacity-50 animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 w-1 h-1 bg-pink-200 rounded-full opacity-60 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>

            {/* Gradient orbs */}
            <div
              className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-white/10 to-purple-300/20 rounded-full animate-pulse-scale"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-pink-300/20 to-white/10 rounded-full animate-pulse-scale"
              style={{ animationDelay: "4s" }}
            ></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center z-10">
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Zap className="w-8 h-8 text-yellow-400" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold cosmic-text-glow">
                  Gata să-ți transformi notele la fizică?
                </h2>
              </div>
              <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Alătură-te miilor de studenți care și-au îmbunătățit performanțele cu platforma PLANCK. Începe călătoria
                ta către succesul în fizică astăzi!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 cosmic-glow"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Începe acum gratuit
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-purple-600 font-semibold text-lg px-8 py-4 rounded-full transition-all duration-300 bg-transparent"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explorează cursurile
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

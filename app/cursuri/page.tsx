"use client"

import { Navigation } from "@/components/navigation"
import { CoursesSection } from "@/components/courses-section"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Users, Clock, Award, PlayCircle, CheckCircle2, Zap } from "lucide-react"

const scrollToCourses = () => {
  const coursesSection = document.getElementById('courses')
  if (coursesSection) {
    coursesSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

const courseStats = [
  {
    icon: Users,
    label: "Studenți activi",
    value: "0",
    color: "text-blue-600",
  },
  {
    icon: Clock,
    label: "Ore de conținut",
    value: "120+",
    color: "text-green-600",
  },
  {
    icon: Award,
    label: "Rata de succes",
    value: "0%",
    color: "text-purple-600",
  },
  {
    icon: Star,
    label: "Rating mediu",
    value: "-/5",
    color: "text-yellow-600",
  },
]

const features = [
  {
    icon: PlayCircle,
    title: "Videoclipuri HD",
    description: "Lecții video de înaltă calitate cu explicații pas cu pas",
  },
  {
    icon: CheckCircle2,
    title: "Exerciții practice",
    description: "Probleme rezolvate și exerciții pentru consolidare",
  },
  {
    icon: Zap,
    title: "Învățare adaptivă",
    description: "Conținut personalizat în funcție de progresul tău",
  },
]

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="cosmic-particles"></div>

          <div className="relative max-w-7xl mx-auto text-center text-white">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 cosmic-text-glow">Cursuri de Fizică</h1>
              <p className="text-xl sm:text-2xl text-purple-100 max-w-3xl mx-auto mb-8 leading-relaxed">
                Descoperă cursurile noastre complete de fizică pentru liceu, cu videoclipuri interactive și explicații
                detaliate
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-12">
                {courseStats.map((stat, index) => (
                  <div
                    key={index}
                    className="text-center animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-purple-200 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={scrollToCourses}
                className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 cosmic-glow"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Începe să înveți acum
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">De ce să alegi cursurile PLANCK?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Oferim o experiență de învățare completă și interactivă
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="border-purple-200 hover:border-purple-400 transition-all duration-300 space-card"
                >
                  <CardHeader className="text-center">
                    <feature.icon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-gray-600">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <CoursesSection />

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Gata să-ți transformi notele la fizică?</h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Alătură-te miilor de studenți care și-au îmbunătățit performanțele cu cursurile PLANCK
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-4 rounded-full font-semibold"
              >
                Începe cursul gratuit
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 rounded-full font-semibold"
              >
                Vezi toate cursurile
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

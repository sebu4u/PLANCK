import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Star, Zap, Users, Clock, PlayCircle, CheckCircle2, BookOpen } from "lucide-react"
import Link from "next/link"

const courses = [
  {
    id: "clasa-9",
    title: "Fizica Clasa a 9-a",
    subtitle: "Mecanica și Optica",
    description: "Înțelege fundamentele fizicii prin mecanică și optică cu explicații clare și exemple practice",
    image: "/placeholder.svg?height=200&width=400",
    chapters: [
      { title: "Cinematica punctului material", duration: "2h 30m", free: true, completed: false },
      { title: "Dinamica punctului material", duration: "3h 15m", free: true, completed: false },
      { title: "Lucrul mecanic și energia", duration: "2h 45m", free: false, completed: false },
      { title: "Impulsul și legea conservării", duration: "2h 20m", free: false, completed: false },
      { title: "Optica geometrică", duration: "3h 00m", free: false, completed: false },
      { title: "Optica ondulatorie", duration: "2h 50m", free: false, completed: false },
    ],
    price: "199 RON",
    originalPrice: "299 RON",
    rating: 5,
    students: 0,
    totalDuration: "16h 40m",
    level: "Începător",
    certificate: true,
    highlights: ["16+ ore de videoclipuri HD", "50+ probleme rezolvate", "Certificat de absolvire", "Acces pe viață"],
  },
  {
    id: "clasa-10",
    title: "Fizica Clasa a 10-a",
    subtitle: "Termodinamica și Electricitate",
    description: "Explorează lumea termodinamicii și electricității cu experimente virtuale și simulări interactive",
    image: "/placeholder.svg?height=200&width=400",
    chapters: [
      { title: "Teoria cinetică a gazelor", duration: "2h 45m", free: true, completed: false },
      { title: "Primul principiu al termodinamicii", duration: "3h 20m", free: true, completed: false },
      { title: "Al doilea principiu al termodinamicii", duration: "2h 55m", free: false, completed: false },
      { title: "Electrostatica", duration: "3h 30m", free: false, completed: false },
      { title: "Curentul electric continuu", duration: "3h 10m", free: false, completed: false },
      { title: "Câmpul magnetic", duration: "2h 40m", free: false, completed: false },
    ],
    price: "229 RON",
    originalPrice: "329 RON",
    rating: 5,
    students: 0,
    totalDuration: "18h 20m",
    level: "Intermediar",
    certificate: true,
    highlights: ["18+ ore de conținut premium", "60+ experimente virtuale", "Simulări interactive", "Suport 24/7"],
  },
]

export function EnhancedCoursesSection() {
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Cursurile noastre premium
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Învață fizica pas cu pas prin videoclipuri interactive și explicații clare
        </p>
      </div>

      <div className="grid gap-8 lg:gap-12">
        {courses.map((course, index) => (
          <Card
            key={course.id}
            className={`overflow-hidden border-purple-200 hover:border-purple-400 transition-all duration-500 space-card ${
              index === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className="lg:flex">
              {/* Course Image */}
              <div className="lg:w-2/5 relative">
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-64 lg:h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge className="bg-white/90 text-purple-600 mb-2">{course.level}</Badge>
                  <div className="flex items-center gap-2 text-white">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{course.rating}</span>
                    <span className="text-white/80">({course.students} studenți)</span>
                  </div>
                </div>
              </div>

              {/* Course Content */}
              <div className="lg:w-3/5 p-6 lg:p-8">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <Badge variant="outline" className="border-purple-300 text-purple-600">
                        {course.subtitle}
                      </Badge>
                    </div>

                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{course.title}</h3>

                    <p className="text-gray-600 mb-6 leading-relaxed">{course.description}</p>

                    {/* Course Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{course.totalDuration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{course.students} studenți</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">{course.chapters.length} capitole</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Certificat inclus</span>
                      </div>
                    </div>

                    {/* Course Highlights */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Ce vei învăța:</h4>
                      <ul className="space-y-2">
                        {course.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Progress Preview */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progres curs</span>
                        <span className="text-sm text-gray-500">2/{course.chapters.length} gratuit</span>
                      </div>
                      <Progress value={(2 / course.chapters.length) * 100} className="h-2" />
                    </div>
                  </div>

                  {/* Pricing and CTA */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-purple-600">{course.price}</span>
                        <span className="text-lg text-gray-400 line-through">{course.originalPrice}</span>
                        <Badge className="bg-red-100 text-red-600">-33%</Badge>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link href={`/cursuri/curand`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 cosmic-glow h-12">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Începe cursul
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="border-purple-300 hover:border-purple-500 hover:text-purple-600 px-6"
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

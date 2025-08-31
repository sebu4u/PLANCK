import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  PlayCircle,
  Lock,
  CheckCircle2,
  Clock,
  Users,
  Star,
  Award,
  BookOpen,
  Download,
  MessageCircle,
} from "lucide-react"
import { generateMetadata } from "@/lib/metadata"
import { courseStructuredData } from "@/lib/structured-data"
import { StructuredData } from "@/components/structured-data"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = generateMetadata('class-10')

const courseData = {
  title: "Fizica Clasa a 10-a",
  subtitle: "Termodinamica și Electricitate",
  description:
    "Cursul avansat de fizică pentru clasa a 10-a, explorând termodinamica și electricitatea cu experimente virtuale și simulări interactive.",
  image: "/placeholder.svg?height=300&width=600",
  price: "229 RON",
  originalPrice: "329 RON",
  rating: 4.8,
  students: 987,
  totalDuration: "18h 20m",
  level: "Intermediar",
  chapters: [
    {
      id: 1,
      title: "Teoria cinetică a gazelor",
      description: "Înțelege comportamentul gazelor și teoria cinetică moleculară",
      duration: "2h 45m",
      lessons: 9,
      free: true,
      completed: false,
      topics: ["Presiunea gazelor", "Temperatura absolută", "Ecuația de stare", "Viteza moleculelor"],
    },
    {
      id: 2,
      title: "Primul principiu al termodinamicii",
      description: "Conservarea energiei în procesele termodinamice",
      duration: "3h 20m",
      lessons: 11,
      free: true,
      completed: false,
      topics: ["Energia internă", "Lucrul termodinamic", "Căldura", "Aplicații practice"],
    },
    {
      id: 3,
      title: "Al doilea principiu al termodinamicii",
      description: "Entropia și eficiența proceselor termodinamice",
      duration: "2h 55m",
      lessons: 8,
      free: false,
      completed: false,
      topics: ["Entropia", "Ciclul Carnot", "Mașini termice", "Frigidere"],
    },
    {
      id: 4,
      title: "Electrostatica",
      description: "Forțele și câmpurile electrice statice",
      duration: "3h 30m",
      lessons: 12,
      free: false,
      completed: false,
      topics: ["Sarcina electrică", "Legea lui Coulomb", "Câmpul electric", "Potențialul electric"],
    },
    {
      id: 5,
      title: "Curentul electric continuu",
      description: "Circuitele electrice și legile fundamentale",
      duration: "3h 10m",
      lessons: 10,
      free: false,
      completed: false,
      topics: ["Curentul electric", "Rezistența", "Legea lui Ohm", "Circuite complexe"],
    },
    {
      id: 6,
      title: "Câmpul magnetic",
      description: "Magnetismul și interacțiunea cu curentul electric",
      duration: "2h 40m",
      lessons: 9,
      free: false,
      completed: false,
      topics: ["Câmpul magnetic", "Forța Lorentz", "Inducția magnetică", "Aplicații"],
    },
  ],
  instructor: {
    name: "Prof. Dr. Alexandru Ionescu",
    title: "Doctor în Fizica Materiei Condensate",
    experience: "20+ ani experiență",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  features: [
    "18+ ore de videoclipuri 4K",
    "60+ experimente virtuale",
    "Simulări interactive avansate",
    "Certificat de absolvire",
    "Acces pe viață",
    "Suport prioritar",
    "Laborator virtual",
    "Teste de evaluare",
  ],
  testimonials: [
    {
      name: "Elena Dumitrescu",
      grade: "Clasa a 10-a",
      content: "Simulările interactive m-au ajutat să înțeleg mult mai bine conceptele complexe!",
      rating: 5,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Radu Popescu",
      grade: "Clasa a 10-a",
      content: "Cel mai complet curs de termodinamică și electricitate. Recomand cu încredere!",
      rating: 5,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ],
}

export default function Clasa10Page() {
  const completedChapters = courseData.chapters.filter((ch) => ch.completed).length
  const progressPercentage = (completedChapters / courseData.chapters.length) * 100

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <StructuredData data={courseStructuredData(courseData)} />
      <Navigation />

      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-12 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
          <div className="cosmic-particles"></div>
          <div className="relative max-w-7xl mx-auto">
            <Link href="/cursuri">
              <Button variant="ghost" className="mb-6 text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Înapoi la cursuri
              </Button>
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-white/20 text-white mb-4">{courseData.level}</Badge>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 cosmic-text-glow">{courseData.title}</h1>
                <p className="text-xl text-blue-100 mb-6">{courseData.subtitle}</p>
                <p className="text-lg text-blue-200 mb-8 leading-relaxed">{courseData.description}</p>

                {/* Course Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center">
                    <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.rating}</div>
                    <div className="text-blue-200 text-sm">Rating</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-6 h-6 text-green-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.students}</div>
                    <div className="text-blue-200 text-sm">Studenți</div>
                  </div>
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.totalDuration}</div>
                    <div className="text-blue-200 text-sm">Durată</div>
                  </div>
                  <div className="text-center">
                    <BookOpen className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.chapters.length}</div>
                    <div className="text-blue-200 text-sm">Capitole</div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold">{courseData.price}</span>
                  <span className="text-xl text-blue-200 line-through">{courseData.originalPrice}</span>
                  <Badge className="bg-red-500 text-white">-30%</Badge>
                </div>

                <div className="flex gap-4">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 cosmic-glow">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Începe cursul acum
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Preview gratuit
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Image
                  src={courseData.image || "/placeholder.svg"}
                  alt={courseData.title}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="rounded-lg shadow-2xl w-full"
                  style={{ width: '100%', height: 'auto' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" className="bg-white/90 text-blue-600 hover:bg-white rounded-full w-20 h-20">
                    <PlayCircle className="w-8 h-8" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
              <TabsTrigger value="reviews">Recenzii</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TabsContent value="curriculum" className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-4">Conținutul cursului</h3>
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      <span>{courseData.chapters.length} capitole</span>
                      <span>•</span>
                      <span>{courseData.chapters.reduce((acc, ch) => acc + ch.lessons, 0)} lecții</span>
                      <span>•</span>
                      <span>{courseData.totalDuration} conținut video</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-sm text-gray-500 mt-2">
                      {completedChapters} din {courseData.chapters.length} capitole completate
                    </p>
                  </div>

                  <div className="space-y-4">
                    {courseData.chapters.map((chapter, index) => (
                      <Card key={chapter.id} className="border-blue-200 hover:border-blue-400 transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                  {index + 1}
                                </div>
                                <CardTitle className="text-lg">{chapter.title}</CardTitle>
                                {chapter.free && <Badge className="bg-green-100 text-green-700">Gratuit</Badge>}
                              </div>
                              <CardDescription className="ml-11">{chapter.description}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{chapter.duration}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="ml-11">
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>{chapter.lessons} lecții</span>
                            <span>•</span>
                            <span>{chapter.duration}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {chapter.topics.map((topic, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            {chapter.free ? (
                              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <PlayCircle className="w-4 h-4 mr-1" />
                                Începe capitolul
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                <Lock className="w-4 h-4 mr-1" />
                                Necesită abonament
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="instructor">
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle>Despre instructor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <Image
                          src={courseData.instructor.avatar || "/placeholder.svg"}
                          alt={courseData.instructor.name}
                          width={0}
                          height={0}
                          sizes="80px"
                          className="w-20 h-20 rounded-full border-4 border-blue-200"
                          style={{ width: '80px', height: '80px' }}
                        />
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{courseData.instructor.name}</h4>
                          <p className="text-blue-600 font-medium">{courseData.instructor.title}</p>
                          <p className="text-gray-600">{courseData.instructor.experience}</p>
                          <p className="mt-4 text-gray-700 leading-relaxed">
                            Cercetător și profesor universitar cu peste 20 de ani de experiență în fizica materiei
                            condensate. Specializat în termodinamică și fenomene electromagnetice. Autor a peste 50 de
                            publicații științifice și mentor pentru sute de studenți.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl font-bold text-blue-600">{courseData.rating}</div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-gray-600">{courseData.students} recenzii</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {courseData.testimonials.map((testimonial, index) => (
                        <Card key={index} className="border-blue-200">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <Image
                                src={testimonial.avatar || "/placeholder.svg"}
                                alt={testimonial.name}
                                width={0}
                                height={0}
                                sizes="48px"
                                className="w-12 h-12 rounded-full border-2 border-blue-200"
                                style={{ width: '48px', height: '48px' }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-semibold">{testimonial.name}</h5>
                                  <span className="text-gray-500 text-sm">•</span>
                                  <span className="text-gray-500 text-sm">{testimonial.grade}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                                <p className="text-gray-700">{testimonial.content}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="faq">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold mb-6">Întrebări frecvente</h3>
                    {[
                      {
                        q: "Sunt necesare cunoștințe prealabile?",
                        a: "Da, este recomandat să ai cunoștințe de fizică de clasa a 9-a și matematică de liceu.",
                      },
                      {
                        q: "Pot accesa laboratorul virtual?",
                        a: "Da, laboratorul virtual este inclus și îți permite să faci experimente interactive.",
                      },
                      {
                        q: "Există suport pentru probleme complexe?",
                        a: "Da, ai acces la sesiuni de Q&A live și la comunitatea cursului pentru întrebări.",
                      },
                      {
                        q: "Cursul este actualizat?",
                        a: "Da, cursul este actualizat anual cu cele mai noi descoperiri și metode de predare.",
                      },
                    ].map((faq, index) => (
                      <Card key={index} className="border-blue-200">
                        <CardContent className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                          <p className="text-gray-600">{faq.a}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="border-blue-200 sticky top-24">
                  <CardHeader>
                    <CardTitle>Ce include cursul</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {courseData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 sticky top-80">
                  <CardHeader>
                    <CardTitle>Acțiuni rapide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Descarcă materiale
                    </Button>
                    <Button variant="outline" className="w-full border-blue-300 hover:border-blue-500">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Comunitate
                    </Button>
                    <Button variant="outline" className="w-full border-blue-300 hover:border-blue-500">
                      <Award className="w-4 h-4 mr-2" />
                      Vezi certificat
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Tabs>
        </section>
      </div>

      <Footer />
    </div>
  )
}

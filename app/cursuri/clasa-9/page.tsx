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
import Link from "next/link"

const courseData = {
  title: "Fizica Clasa a 9-a",
  subtitle: "Mecanica și Optica",
  description:
    "Cursul complet de fizică pentru clasa a 9-a, acoperind mecanica și optica cu explicații detaliate și exemple practice.",
  image: "/placeholder.svg?height=300&width=600",
  price: "199 RON",
  originalPrice: "299 RON",
  rating: 4.9,
  students: 1247,
  totalDuration: "16h 40m",
  level: "Începător",
  chapters: [
    {
      id: 1,
      title: "Cinematica punctului material",
      description: "Înțelege mișcarea corpurilor și conceptele fundamentale ale cinematicii",
      duration: "2h 30m",
      lessons: 8,
      free: true,
      completed: false,
      topics: ["Poziție și deplasare", "Viteza", "Accelerația", "Mișcarea rectilinie uniformă"],
    },
    {
      id: 2,
      title: "Dinamica punctului material",
      description: "Explorează forțele și legile lui Newton",
      duration: "3h 15m",
      lessons: 10,
      free: true,
      completed: false,
      topics: ["Legile lui Newton", "Forțe de frecare", "Forța elastică", "Aplicații practice"],
    },
    {
      id: 3,
      title: "Lucrul mecanic și energia",
      description: "Conceptele de lucru mecanic, energie cinetică și potențială",
      duration: "2h 45m",
      lessons: 9,
      free: false,
      completed: false,
      topics: ["Lucrul mecanic", "Energia cinetică", "Energia potențială", "Conservarea energiei"],
    },
    {
      id: 4,
      title: "Impulsul și legea conservării",
      description: "Impulsul, cantitatea de mișcare și ciocnirile",
      duration: "2h 20m",
      lessons: 7,
      free: false,
      completed: false,
      topics: ["Impulsul", "Cantitatea de mișcare", "Ciocniri elastice", "Ciocniri inelastice"],
    },
    {
      id: 5,
      title: "Optica geometrică",
      description: "Reflexia și refracția luminii, lentile și oglinzi",
      duration: "3h 00m",
      lessons: 11,
      free: false,
      completed: false,
      topics: ["Reflexia luminii", "Refracția luminii", "Lentile", "Oglinzi sferice"],
    },
    {
      id: 6,
      title: "Statica și echilibru",
      description: "Echilibrul corpurilor, statica și principiile hidrostaticii",
      duration: "2h 50m",
      lessons: 8,
      free: false,
      completed: false,
      topics: ["Echilibru", "Statica", "Hidrostatica"],
    },
  ],
  instructor: {
    name: "Prof. Dr. Maria Popescu",
    title: "Doctor în Fizică Teoretică",
    experience: "15+ ani experiență",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  features: [
    "16+ ore de videoclipuri HD",
    "50+ probleme rezolvate pas cu pas",
    "Simulări interactive",
    "Certificat de absolvire",
    "Acces pe viață",
    "Suport comunitate",
    "Materiale descărcabile",
    "Quiz-uri de evaluare",
  ],
  testimonials: [
    {
      name: "Ana Georgescu",
      grade: "Clasa a 9-a",
      content: "Cel mai bun curs de fizică pe care l-am urmărit! Explicațiile sunt foarte clare.",
      rating: 5,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Mihai Ionescu",
      grade: "Clasa a 9-a",
      content: "Am trecut de la nota 6 la nota 9 la fizică datorită acestui curs!",
      rating: 5,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ],
}

export default function Clasa9Page() {
  const completedChapters = courseData.chapters.filter((ch) => ch.completed).length
  const progressPercentage = (completedChapters / courseData.chapters.length) * 100

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-12 px-4 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 text-white overflow-hidden">
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
                <p className="text-xl text-purple-100 mb-6">{courseData.subtitle}</p>
                <p className="text-lg text-purple-200 mb-8 leading-relaxed">{courseData.description}</p>

                {/* Course Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center">
                    <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.rating}</div>
                    <div className="text-purple-200 text-sm">Rating</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.students}</div>
                    <div className="text-purple-200 text-sm">Studenți</div>
                  </div>
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-green-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.totalDuration}</div>
                    <div className="text-purple-200 text-sm">Durată</div>
                  </div>
                  <div className="text-center">
                    <BookOpen className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{courseData.chapters.length}</div>
                    <div className="text-purple-200 text-sm">Capitole</div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold">{courseData.price}</span>
                  <span className="text-xl text-purple-200 line-through">{courseData.originalPrice}</span>
                  <Badge className="bg-red-500 text-white">-33%</Badge>
                </div>

                <div className="flex gap-4">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 cosmic-glow">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Începe cursul acum
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-purple-600"
                  >
                    Preview gratuit
                  </Button>
                </div>
              </div>

              <div className="relative">
                <img
                  src={courseData.image || "/placeholder.svg"}
                  alt={courseData.title}
                  className="rounded-lg shadow-2xl w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" className="bg-white/90 text-purple-600 hover:bg-white rounded-full w-20 h-20">
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
                      <Card key={chapter.id} className="border-purple-200 hover:border-purple-400 transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                                  {index + 1}
                                </div>
                                <CardTitle className="text-lg">{chapter.title}</CardTitle>
                                {chapter.id === 1 && <Badge className="bg-green-100 text-green-700">Gratuit</Badge>}
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
                            <Link href={`/cursuri/clasa-9/${chapter.id}`} passHref legacyBehavior>
                              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                <PlayCircle className="w-4 h-4 mr-1" />
                                Începe capitolul
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="instructor">
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle>Despre instructor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <img
                          src={courseData.instructor.avatar || "/placeholder.svg"}
                          alt={courseData.instructor.name}
                          className="w-20 h-20 rounded-full border-4 border-purple-200"
                        />
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{courseData.instructor.name}</h4>
                          <p className="text-purple-600 font-medium">{courseData.instructor.title}</p>
                          <p className="text-gray-600">{courseData.instructor.experience}</p>
                          <p className="mt-4 text-gray-700 leading-relaxed">
                            Profesor universitar cu peste 15 ani de experiență în predarea fizicii. Specializat în
                            fizica teoretică și autor a numeroase lucrări științifice. Pasionat de educație și de
                            găsirea celor mai eficiente metode de predare.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl font-bold text-purple-600">{courseData.rating}</div>
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
                        <Card key={index} className="border-purple-200">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <img
                                src={testimonial.avatar || "/placeholder.svg"}
                                alt={testimonial.name}
                                className="w-12 h-12 rounded-full border-2 border-purple-200"
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
                        q: "Cât timp am acces la curs?",
                        a: "Ai acces pe viață la toate materialele cursului, inclusiv actualizările viitoare.",
                      },
                      {
                        q: "Pot descărca videoclipurile?",
                        a: "Da, poți descărca toate videoclipurile pentru vizionare offline.",
                      },
                      {
                        q: "Există suport pentru întrebări?",
                        a: "Da, ai acces la comunitatea cursului unde poți pune întrebări și primi răspunsuri.",
                      },
                      {
                        q: "Primesc certificat la final?",
                        a: "Da, vei primi un certificat de absolvire după completarea tuturor capitolelor.",
                      },
                    ].map((faq, index) => (
                      <Card key={index} className="border-purple-200">
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
                <Card className="border-purple-200 sticky top-24">
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

                <Card className="border-purple-200 sticky top-80">
                  <CardHeader>
                    <CardTitle>Acțiuni rapide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Descarcă materiale
                    </Button>
                    <Button variant="outline" className="w-full border-purple-300 hover:border-purple-500">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Comunitate
                    </Button>
                    <Button variant="outline" className="w-full border-purple-300 hover:border-purple-500">
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

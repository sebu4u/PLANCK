import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Ana Popescu",
    grade: "Clasa a 10-a",
    content:
      "PLANCK m-a ajutat să înțeleg fizica mult mai bine. Explicațiile sunt clare și problemele sunt foarte bine organizate.",
    rating: 5,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    name: "Mihai Ionescu",
    grade: "Clasa a 9-a",
    content: "Cursurile video sunt fantastice! Am reușit să îmi îmbunătățesc notele la fizică considerabil.",
    rating: 5,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    name: "Elena Dumitrescu",
    grade: "Absolventă",
    content: "Platforma PLANCK mi-a fost de mare ajutor în pregătirea pentru BAC. Recomand cu încredere!",
    rating: 5,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-black dark:text-white mb-4">Ce spun studenții</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Mii de studenți și-au îmbunătățit performanțele cu PLANCK
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card
            key={index}
            className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-[hsl(348,83%,47%)] transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[hsl(348,83%,47%)] text-[hsl(348,83%,47%)]" />
                ))}
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.content}"</p>

              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
                />
                <div>
                  <div className="text-black dark:text-white font-medium">{testimonial.name}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">{testimonial.grade}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

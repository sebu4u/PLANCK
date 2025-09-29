import { BookOpen, PlayCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const lessonPreviews = [
  { id: "cinematica", title: "Cinematica punctului material", grade: "Clasa a 9-a" },
  { id: "dinamica", title: "Dinamica punctului material", grade: "Clasa a 9-a" },
  { id: "energie", title: "Lucrul mecanic și energia", grade: "Clasa a 9-a" },
  { id: "electrostatica", title: "Electrostatica", grade: "Clasa a 10-a" },
  { id: "curent-continu", title: "Curentul electric continuu", grade: "Clasa a 10-a" },
  { id: "camp-magnetic", title: "Câmpul magnetic", grade: "Clasa a 10-a" },
]

export function CoursesSection() {
  return (
    <section id="courses" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:py-10 min-h-[70vh] flex items-start">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 w-full">
          <div className="self-center text-center lg:text-left animate-fade-in-up">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Pagina de cursuri</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Lecții de Fizică 100% Gratuite
              <span className="block text-gray-700 font-extrabold">pentru toate clasele de liceu</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Descoperă pagina noastră de cursuri unde găsești lecții complete de fizică,
              structurate pe clase și capitole. Tot conținutul este disponibil gratuit,
              ca să înveți în ritmul tău.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/cursuri" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 transition-colors">
                <PlayCircle className="w-5 h-5 mr-2" />
                Deschide pagina de cursuri
              </Link>
              <Link href="/cursuri" className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-purple-300 text-purple-700 hover:border-purple-500 hover:text-purple-800 transition-colors">
                Vezi toate lecțiile <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>

          <div className="animate-fade-in-up lg:animate-fade-in-left">
            <div className="rounded-3xl border border-purple-200 bg-white shadow-sm p-4 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {lessonPreviews.map((lesson, index) => (
                  <Link key={lesson.id} href="/cursuri" className={`group block p-5 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all ${index >= 3 ? 'hidden sm:block' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                        {lesson.grade}
                      </span>
                      <PlayCircle className="w-4 h-4 text-purple-500 opacity-80 group-hover:opacity-100" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 leading-snug">
                      {lesson.title}
                    </h3>
                    <div className="mt-3 text-sm text-purple-700 inline-flex items-center gap-1">
                      Începe lecția <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/cursuri" className="text-sm font-medium text-purple-700 hover:text-purple-800 inline-flex items-center">
                  Vezi mai multe lecții <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

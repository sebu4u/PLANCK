import { Lock } from "lucide-react"
import Link from "next/link"

const courses = [
  {
    id: "clasa-9",
    title: "Fizica Clasa a 9-a",
    subtitle: "Mecanica și Optica",
    rating: 4.9,
    students: 1247,
    price: "199 RON",
    chapters: [
      { title: "Cinematica punctului material", locked: false },
      { title: "Dinamica punctului material", locked: false },
      { title: "Lucrul mecanic și energia", locked: true },
      { title: "Impulsul și legea conservării", locked: true },
      { title: "Optica geometrică", locked: true },
      { title: "Statica și echilibru", locked: true },
    ],
  },
  {
    id: "clasa-10",
    title: "Fizica Clasa a 10-a",
    subtitle: "Termodinamica și Electricitate",
    rating: 4.8,
    students: 987,
    price: "229 RON",
    chapters: [
      { title: "Teoria cinetică a gazelor", locked: false },
      { title: "Primul principiu al termodinamicii", locked: false },
      { title: "Al doilea principiu al termodinamicii", locked: true },
      { title: "Electrostatica", locked: true },
      { title: "Curentul electric continuu", locked: true },
      { title: "Câmpul magnetic", locked: true },
    ],
  },
]

export function CoursesSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12 sm:mb-16 animate-fade-in-up">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Cursuri de Fizică
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
          Învață fizica pas cu pas prin lecții structurate și explicații detaliate
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {courses.map((course) => (
          <div
            key={course.id}
            className="border border-purple-200 rounded-3xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-purple-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{course.title}</h3>
              </div>
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">{course.price}</div>
            </div>

            <div className="text-gray-600 mb-4">{course.subtitle}</div>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center text-yellow-400">
                <svg
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
              <span className="font-medium">{course.rating}</span>
              <span className="text-gray-500">{course.students} studenți</span>
            </div>

            <div className="space-y-2 mb-6">
              {course.chapters.map((chapter, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <span>{chapter.title}</span>
                  {chapter.locked && <Lock size={16} className="text-purple-600" />}
                </div>
              ))}
            </div>

            <Link href={`/cursuri/${course.id}`}>
              <button className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-colors">
                Începeți cursul
              </button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

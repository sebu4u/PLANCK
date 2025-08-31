import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export function AboutPlanckSection() {
  return (
    <section className="py-16 sm:py-20 px-4 max-w-7xl mx-auto lg:py-6">
      {/* Testimonials Section */}
      <div className="animate-fade-in-up-delay-3 mb-3 mt-2 sm:mt-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-black dark:text-white mb-4">Ce spun elevii</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Mii de elevi și-au îmbunătățit performanțele cu PLANCK
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
              <Image
                src="https://i.ibb.co/whxDdCfF/Whats-App-Image-2025-08-30-at-17-01-30-5b2ca226.jpg"
                alt="Ana Popescu"
                width={0}
                height={0}
                sizes="40px"
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
                style={{ width: '40px', height: '40px' }}
              />
              <div>
                <div className="text-black dark:text-white font-medium">Stefan Rares</div>
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
              <Image
                src="https://i.ibb.co/h1LhbfRG/Whats-App-Image-2025-08-30-at-17-03-19-adac22c2.jpg"
                alt="Mihai David"
                width={0}
                height={0}
                sizes="40px"
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
                style={{ width: '40px', height: '40px' }}
              />
              <div>
                <div className="text-black dark:text-white font-medium">Mihai David</div>
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
              <Image
                src="https://i.ibb.co/Jwvr4DmK/Whats-App-Image-2025-08-30-at-17-02-41-153070e7.jpg"
                alt="Elena Dumitrescu"
                width={0}
                height={0}
                sizes="40px"
                className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700"
                style={{ width: '40px', height: '40px' }}
              />
              <div>
                <div className="text-black dark:text-white font-medium">Elena Pascu</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Absolventă</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Star } from "lucide-react"

const reviews = [
  {
    name: "Stefan Rares",
    grade: "Clasa a 10-a", 
    rating: 5,
    review: "PLANCK m-a ajutat să înțeleg fizica mult mai bine. Explicațiile sunt clare și problemele sunt foarte bine organizate."
  },
  {
    name: "Mihai David",
    grade: "Clasa a 11-a",
    rating: 4, 
    review: "Cursurile video sunt fantastice! Am reușit să îmi îmbunătățesc notele la fizică considerabil."
  },
  {
    name: "Dinu Alexandru",
    grade: "absolvent",
    rating: 5,
    review: "Platforma PLANCK mi-a fost de mare ajutor în pregătirea pentru BAC. Recomand cu încredere!"
  }
]

export default function TestimonialsReviewsSection() {
  return (
    <section className="bg-[#0d1117] px-6 -mt-20 pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 border-x-2 border-b-2 border-white/20 rounded-b-lg overflow-hidden">
          {reviews.map((review, index) => (
            <div 
              key={index}
              className={`relative scroll-animate-fade-up overflow-hidden ${
                index < reviews.length - 1 ? 'border-r-2 border-r-white/20' : ''
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Header content above card */}
              <div className="p-6 pb-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  {review.name}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  {review.grade}
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < review.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-600'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Review card - partially visible */}
              <div className="relative bg-gradient-to-r from-[#1a1b26] to-[#14151f] border border-white/20 rounded-lg ml-8 mr-4 mb-4 p-6 h-56 overflow-hidden -mr-2 -mb-2">
                {/* Review text with gradient mask */}
                <p className="text-gray-300 leading-relaxed text-lg" style={{
                  background: 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.4))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  "{review.review}"
                </p>
                
                {/* Profile icon - bottom right */}
                <div className="absolute bottom-4 right-4 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
                </div>

                {/* Fade-out overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

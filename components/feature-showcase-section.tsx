import Image from 'next/image'

export default function FeatureShowcaseSection() {
  return (
    <section className="bg-[#0d1117] py-20 px-0 lg:px-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        {/* Heading text */}
        <div className="scroll-animate-fade-up text-center mb-12 md:mb-16 pt-4 md:pt-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Crește-ți nota mai repede cu <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">AI</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto px-4 md:px-0">
            Rezolvă probleme reale, primește explicații rapide de la AI și păstrează progresul pentru orice test.
          </p>
        </div>

        {/* Radial glow effect above the card */}
        <div className="relative flex justify-center mb-8">
          <div className="absolute top-0 w-[800px] h-[400px] bg-gradient-radial from-blue-300/60 via-indigo-300/40 to-transparent rounded-full blur-3xl"></div>
        </div>

        {/* Large outer card with glass effect */}
        <div className="relative -mx-6 lg:mx-0">
          {/* Outer card - large, rounded top only, with glass effect */}
          <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-t-[1.5rem] sm:rounded-t-[2rem] border-x-0 lg:border-x-2 border-t-2 border-white/20 overflow-visible after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-1px] after:w-screen after:border-b after:border-white/10 after:pointer-events-none scroll-animate-transform-up z-10">
            {/* Pink to blue glow effect - constant opacity, not affected by transform animation */}
            <div className="absolute inset-4 sm:inset-6 md:inset-8 pointer-events-none">
              <div className="absolute inset-2 bg-gradient-to-br from-pink-400/40 via-purple-400/30 to-blue-400/40 rounded-2xl blur-3xl"></div>
              <div className="absolute inset-4 bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-blue-300/30 rounded-2xl blur-2xl"></div>
            </div>
            {/* Glass background - transparent with blur */}
            <div className="absolute inset-0 bg-white/5 rounded-t-[1.5rem] sm:rounded-t-[2rem] backdrop-blur-xl"></div>
            
            {/* Additional glass layer for depth */}
            <div className="absolute inset-0 bg-white/3 rounded-t-[1.5rem] sm:rounded-t-[2rem] backdrop-blur-lg"></div>
            
            {/* Inner card container */}
            <div className="absolute inset-4 sm:inset-6 md:inset-8 flex items-center justify-center">
              {/* Inner card - fully rounded, light background */}
              <div className="relative w-full max-w-xl h-full bg-gradient-to-br from-white to-purple-50/80 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-white/10 backdrop-blur-sm">
                {/* Image area */}
                <div className="relative w-full h-full">
                  <Image
                    src="/feature-showcase-image.jpg"
                    alt="Smart Learning Platform Feature"
                    fill
                    className="object-cover rounded-xl sm:rounded-2xl"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

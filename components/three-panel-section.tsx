import Link from 'next/link'

export default function ThreePanelSection() {
  return (
    <section className="bg-[#0d1117] px-0 lg:px-6 -mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-0">
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[300px] border-x-0 lg:border-x border-b-0 border-white/10 border-t-0 overflow-visible scroll-animate-fade-up after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-1px] after:w-screen after:border-b after:border-white/10 after:pointer-events-none -mx-6 lg:mx-0">
          {/* Left Panel - Problems Catalog (2/3 width on desktop) */}
          <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center border-r border-r-white/10 scroll-animate-fade-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Peste 500 de probleme rezolvate complet video.
            </h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Catalogul nostru cuprinde probleme din toată materia de fizică de liceu, explicate pas cu pas cu soluții video complete.
            </p>
            <Link 
              href="/probleme"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200 text-lg font-medium group w-fit"
            >
              <span className="relative">
                Explorează catalogul de probleme
                <span className="absolute bottom-0 left-0 h-0.5 bg-current w-0 transition-all duration-300 group-hover:w-full"></span>
              </span>
              <svg 
                className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Right Panels Container */}
          <div className="lg:col-span-1 flex flex-col">
            {/* Top Right Panel - Physics Courses */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center border-b border-b-white/10 scroll-animate-fade-up animate-delay-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Cursuri de Fizică</h3>
              </div>
              <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                Lecții complete și gratuite de fizică pentru toate clasele de liceu, cu explicații clare și exemple practice.
              </p>
              <Link 
                href="/cursuri"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium group w-fit"
              >
                <span className="relative">
                  Accesează cursurile
                  <span className="absolute bottom-0 left-0 h-0.5 bg-current w-0 transition-all duration-300 group-hover:w-full"></span>
                </span>
                <svg 
                  className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Bottom Right Panel - Code with Planck */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center scroll-animate-fade-up animate-delay-400">
              <h3 className="text-2xl font-bold text-white mb-4">
                Code with Planck
              </h3>
              <p className="text-lg text-gray-400 leading-relaxed">
                IDE-ul integrat cu AI care te ajută să înveți și să înțelegi informatica direct din browser, cu asistență inteligentă pentru cod.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

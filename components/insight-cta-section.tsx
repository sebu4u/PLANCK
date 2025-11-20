"use client"

import Link from "next/link"

export default function InsightCTASection() {
  return (
    <section className="relative w-full min-h-screen sm:h-screen flex items-center justify-center overflow-hidden py-12 sm:py-0">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/insight-cta-background.jpg')", // Va trebui să adaugi această imagine în public/
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      
      {/* Overlay pentru contrast text */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Conținut centrat */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Titlu principal */}
        <h2 className="scroll-animate-fade-up text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight">
          Transformă-ți modul de a învăța
        </h2>
        
        {/* Subtitlu */}
        <p className="scroll-animate-fade-up animate-delay-200 text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-200 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
          Alătură-te elevilor care învață mai repede, mai bine și fără stres.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Testează gratuit Planck AI și vezi diferența.
        </p>
        
        {/* Butoane CTA */}
        <div className="scroll-animate-fade-up animate-delay-400 flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center items-center">
          <Link 
            href="/insight/chat"
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
          >
            Încearcă Insight Chat
          </Link>
          
          <button className="w-full sm:w-auto bg-transparent border-2 border-white hover:bg-white hover:text-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            Activează Insight Premium
          </button>
        </div>
      </div>
    </section>
  )
}

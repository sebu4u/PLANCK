"use client"

import { usePathname } from "next/navigation"
import { LaserFlow } from "@/components/laser-flow"
import { LiveStats } from "@/components/live-stats"
import { useRef, useState, useEffect } from "react"

export function DespreHeroSection({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname()
  const sectionRef = useRef<HTMLElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [beamOffset, setBeamOffset] = useState({ x: 0.1, y: 0.0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [laserKey, setLaserKey] = useState(0)

  useEffect(() => {
    setLaserKey((prev) => prev + 1)
  }, [pathname])

  useEffect(() => {
    const updateAlignment = () => {
      if (imageContainerRef.current && sectionRef.current) {
        const sectionRect = sectionRef.current.getBoundingClientRect()
        const imageRect = imageContainerRef.current.getBoundingClientRect()
        const relativeTop = imageRect.top - sectionRect.top
        const offsetY = 0.5 - (relativeTop / sectionRect.height)
        const offsetX = 0.05
        setBeamOffset({ x: offsetX, y: offsetY })
      }
    }

    updateAlignment()
    const timeout = setTimeout(updateAlignment, 100)

    window.addEventListener("resize", updateAlignment)
    const resizeObserver = new ResizeObserver(updateAlignment)
    if (imageContainerRef.current) resizeObserver.observe(imageContainerRef.current)
    if (sectionRef.current) resizeObserver.observe(sectionRef.current)

    return () => {
      window.removeEventListener("resize", updateAlignment)
      resizeObserver.disconnect()
      clearTimeout(timeout)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      className="relative min-h-svh lg:min-h-[140vh] w-full overflow-hidden"
      style={{ backgroundColor: "#090b0d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="hidden lg:block absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovering ? 0.3 : 0,
          backgroundImage: "url(/hero1.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
        }}
      />

      <div className="absolute inset-0 z-[1] pointer-events-none">
        <LaserFlow
          key={laserKey}
          horizontalBeamOffset={beamOffset.x}
          verticalBeamOffset={beamOffset.y}
          color="#cf9eff"
          flowSpeed={0.4}
          wispDensity={1.5}
          isStatic={isMobile}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-36 lg:pt-52 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 w-full flex flex-col justify-center">
            <LiveStats />

            <h1 className="scroll-animate-fade-up text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black text-white mb-4 leading-tight">
              PLANCK
            </h1>
            <p className="scroll-animate-fade-up animate-delay-200 font-dancing text-3xl sm:text-4xl md:text-5xl text-gray-200 mb-3 leading-relaxed">
              Think deeper
            </p>
            <p className="scroll-animate-fade-up animate-delay-300 text-lg sm:text-xl text-gray-400 mb-16 lg:mb-24 max-w-xl">
              Echipa și misiunea noastră de a face fizica și informatica accesibile pentru toți liceenii.
            </p>

            <div
              ref={imageContainerRef}
              className="relative w-[90vw] mx-auto lg:w-[60vw] xl:w-[1152px] lg:ml-auto lg:mr-0 pointer-events-none"
              style={{ aspectRatio: "16/9" }}
            >
              <div
                className="lg:hidden absolute left-1/2 -translate-x-1/2 -top-[30%] w-[80%] h-[60%] bg-[#cf9eff]/40 blur-[80px] rounded-full pointer-events-none"
                style={{ zIndex: 0 }}
              />

              <div className="absolute left-[-15%] top-1/2 -translate-y-1/2 w-[40%] h-[60%] bg-white/10 blur-[80px] rounded-full z-0 pointer-events-none" />
              <div className="absolute right-[-25%] top-1/2 -translate-y-1/2 w-[60%] h-[100%] bg-[#cf9eff]/30 blur-[100px] rounded-full z-0 pointer-events-none" />

              <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[#0d1117]/50 backdrop-blur-sm z-10 w-full h-full">
                <img src="/hero.png" alt="Hero" className="w-full h-full object-cover" />
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/4 lg:h-1/2 bg-gradient-to-t from-[#090b0d] to-transparent"
                  style={{ zIndex: 20 }}
                />
              </div>

              <div
                className="absolute inset-0 rounded-2xl border-t border-r border-[#cf9eff] z-20 pointer-events-none"
                style={{
                  maskImage: "linear-gradient(to bottom left, black 0%, transparent 50%)",
                  WebkitMaskImage: "linear-gradient(to bottom left, black 0%, transparent 50%)",
                }}
              />
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[200px] lg:h-[480px] bg-[linear-gradient(to_top,#090b0d_40%,transparent)] z-40 pointer-events-none" />

      <div className="absolute bottom-6 lg:bottom-20 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-gray-500 text-sm mb-2">Tot ce ai nevoie pentru a învăța fizică mai ușor.</p>
          <p className="text-white text-sm font-medium">
            Lecții interactive · Probleme rezolvate · AI Tutor · Teste grilă · Memorator · Simulări BAC
          </p>
        </div>
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LaserFlow } from "@/components/laser-flow"
import { LiveStats } from "@/components/live-stats"
import { useRef, useState, useEffect } from "react"

export function HomePageHeroRedesign({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname()
    const revealImgRef = useRef<HTMLImageElement>(null)
    const sectionRef = useRef<HTMLElement>(null)
    const imageContainerRef = useRef<HTMLDivElement>(null)
    const [beamOffset, setBeamOffset] = useState({ x: 0.1, y: 0.0 })
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    // Key to force LaserFlow remount on navigation
    const [laserKey, setLaserKey] = useState(0)

    // Force LaserFlow remount when navigating to this page
    useEffect(() => {
        setLaserKey(prev => prev + 1)
    }, [pathname])

    useEffect(() => {
        const updateAlignment = () => {
            if (imageContainerRef.current && sectionRef.current) {
                const sectionRect = sectionRef.current.getBoundingClientRect();
                const imageRect = imageContainerRef.current.getBoundingClientRect();

                // Calculate position relative to the section
                const relativeTop = imageRect.top - sectionRect.top;
                const relativeLeft = imageRect.left - sectionRect.left;

                // Calculate normalized offsets for the shader
                // Vertical: 0.0 is center. Positive moves up.
                // Formula derived: 0.5 - (targetY / height)
                const offsetY = 0.5 - (relativeTop / sectionRect.height);

                // Horizontal: 0.0 is center. Positive moves right.
                // Fixed offset as per user request: 5% to the right
                const offsetX = 0.05;

                setBeamOffset({ x: offsetX, y: offsetY });
            }
        }

        // Initial calc
        updateAlignment();
        const timeout = setTimeout(updateAlignment, 100);

        window.addEventListener('resize', updateAlignment);

        const resizeObserver = new ResizeObserver(updateAlignment);
        if (imageContainerRef.current) resizeObserver.observe(imageContainerRef.current);
        if (sectionRef.current) resizeObserver.observe(sectionRef.current);

        return () => {
            window.removeEventListener('resize', updateAlignment);
            resizeObserver.disconnect();
            clearTimeout(timeout);
        }
    }, [])

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect()
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            })
        }
    }

    return (
        <section
            ref={sectionRef}
            id="hero-section"
            className="relative min-h-svh lg:min-h-[140vh] w-full overflow-hidden"
            style={{ backgroundColor: '#090b0d' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Background Image with Circular Hover Reveal */}
            <div
                className="hidden lg:block absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
                style={{
                    opacity: isHovering ? 0.3 : 0,
                    backgroundImage: 'url(/hero1.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    maskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
                    WebkitMaskImage: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
                }}
            />

            {/* Background LaserFlow Effect */}
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

                    {/* Left Column: Text Content */}
                    <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 w-full flex flex-col justify-center">

                        {/* Live Stats - Online Users & Solved Problems */}
                        <LiveStats />

                        {/* Original Text Content */}
                        <h1 className="scroll-animate-fade-up text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                            Where human curiosity
                            <span className="block">meets intelligent learning.</span>
                        </h1>
                        <p className="scroll-animate-fade-up animate-delay-200 text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                            Înveți fizică și informatică cu AI, exerciții interactive și progres salvat.
                        </p>

                        {/* Action buttons */}
                        <div className="scroll-animate-fade-up animate-delay-400 flex flex-row gap-4 justify-center items-center lg:justify-start lg:items-start mb-16 lg:mb-24">
                            <Link href="/probleme" className="flex justify-center">
                                <Button
                                    size="lg"
                                    className="bg-white text-black hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 rounded-full"
                                >
                                    Rezolvă o problemă
                                </Button>
                            </Link>
                            <Link href="/insight/chat" className="group relative inline-flex">
                                <span className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-purple-400/60 to-blue-400/60 -z-20 pointer-events-none"></span>
                                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none"></span>
                                <span className="absolute inset-[1px] rounded-full bg-transparent group-hover:bg-transparent -z-10 pointer-events-none"></span>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-white text-white hover:border-transparent transition-all duration-300 flex items-center gap-2 bg-transparent relative z-10 rounded-full"
                                >
                                    <span className="relative z-10 bg-gradient-to-r from-white to-white group-hover:from-purple-400 group-hover:to-blue-400 bg-clip-text group-hover:text-transparent transition-all duration-300">
                                        Învață cu AI
                                    </span>
                                </Button>
                            </Link>
                        </div>

                        {/* Placeholder Image - Centered, 70% screen width */}
                        <div
                            ref={imageContainerRef}
                            className="relative w-[90vw] mx-auto lg:w-[60vw] xl:w-[1152px] lg:ml-auto lg:mr-0 pointer-events-none"
                            style={{ aspectRatio: '16/9' }}
                        >
                            {/* Mobile-only Purple Glow Behind Card - renders behind LaserFlow (z-0) */}
                            <div
                                className="lg:hidden absolute left-1/2 -translate-x-1/2 -top-[30%] w-[80%] h-[60%] bg-[#cf9eff]/40 blur-[80px] rounded-full pointer-events-none"
                                style={{ zIndex: 0 }}
                            />

                            {/* Radial Glow Effects */}
                            <div className="absolute left-[-15%] top-1/2 -translate-y-1/2 w-[40%] h-[60%] bg-white/10 blur-[80px] rounded-full z-0 pointer-events-none" />
                            <div className="absolute right-[-25%] top-1/2 -translate-y-1/2 w-[60%] h-[100%] bg-[#cf9eff]/30 blur-[100px] rounded-full z-0 pointer-events-none" />

                            <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[#0d1117]/50 backdrop-blur-sm z-10 w-full h-full">
                                {/* Fallback/Placeholder Image */}
                                <img
                                    src="/hero.png"
                                    alt="Hero"
                                    className="w-full h-full object-cover"
                                />

                                {/* Bottom Fade Effect - smaller on mobile */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-1/4 lg:h-1/2 bg-gradient-to-t from-[#090b0d] to-transparent"
                                    style={{ zIndex: 20 }}
                                />
                            </div>

                            {/* Gradient Outline - Top Right */}
                            <div
                                className="absolute inset-0 rounded-2xl border-t border-r border-[#cf9eff] z-20 pointer-events-none"
                                style={{
                                    maskImage: 'linear-gradient(to bottom left, black 0%, transparent 50%)',
                                    WebkitMaskImage: 'linear-gradient(to bottom left, black 0%, transparent 50%)'
                                }}
                            />

                            {/* Laser Connection Point - Visual Guide (Optional, the laser itself is background) */}
                            {/* The user wants the laser to touch the top of the image. 
                   Since the LaserFlow is a full-screen background canvas, we align it visually.
                   The laser comes down at a specific X fraction. We can try to align the image to that X fraction 
                   or adjust the beam offset to match the image.
                   Let's say we position the image and then maybe we can adjust the beam offset via props if strictly needed,
                   but visual alignment via CSS is easier.
               */}
                        </div>

                    </div>

                    {/* Right Column - Empty (Card Stack Removed) */}
                    <div className="hidden lg:block">
                        {/* Space reserved or empty as per instruction to remove card stack */}
                    </div>
                </div>
            </div>

            {/* Bottom Fade Gradient - Overlays everything, smaller on mobile */}
            <div className="absolute bottom-0 left-0 right-0 h-[200px] lg:h-[480px] bg-[linear-gradient(to_top,#090b0d_40%,transparent)] z-40 pointer-events-none" />

            {/* Feature Text - Over the gradient */}
            <div className="absolute bottom-6 lg:bottom-20 left-0 right-0 z-50 pointer-events-none">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-gray-500 text-sm mb-2">
                        Tot ce ai nevoie pentru a învăța fizică mai ușor.
                    </p>
                    <p className="text-white text-sm font-medium">
                        Lecții interactive · Probleme rezolvate · AI Tutor · Teste grilă · Memorator · Simulări BAC
                    </p>
                </div>
            </div>
        </section>
    )
}

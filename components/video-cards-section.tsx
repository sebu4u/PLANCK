"use client"

import { useRef } from "react"
import { FadeInUp } from "@/components/scroll-animations"

interface VideoCardProps {
    videoSrc: string
    title: string
    description: string
    className?: string
}

function VideoCard({ videoSrc, title, description, className = "" }: VideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.log("Video play failed:", error);
            })
        }
    }

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
        }
    }

    return (
        <div
            className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Video */}
            <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
            >
                <source src={videoSrc} type="video/mp4" />
            </video>

            {/* Bottom fade gradient overlay */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 40%, transparent 100%)'
                }}
            />

            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                <h3 className="text-white font-semibold text-base mb-1">
                    {title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    )
}

export function VideoCardsSection() {
    const cards = [
        {
            videoSrc: "/videos/AIo.mp4",
            title: "Catalog de probleme cu AI",
            description: "Sute de probleme rezolvate pas cu pas, cu ajutorul inteligenței artificiale."
        },
        {
            videoSrc: "/videos/grilev.mp4",
            title: "Grile pentru admitere",
            description: "Teste grile interactive pentru pregătirea examenelor de admitere."
        },
        {
            videoSrc: "/videos/cod.mp4",
            title: "Planck Code",
            description: "Scrie și rulează cod Python pentru probleme de fizică și simulări."
        },
        {
            videoSrc: "/videos/sketcho.mp4",
            title: "Tabla colaborativă",
            description: "Tablă interactivă pentru sesiuni de studiu și rezolvări în echipă."
        }
    ]

    return (
        <section
            className="relative w-full py-20 lg:py-28"
            style={{
                backgroundColor: '#f6f5f4',
                minHeight: '110vh'
            }}
        >
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <FadeInUp className="text-left mb-8">
                    <h2
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
                        style={{ color: '#0b0d10' }}
                    >
                        Construit pentru performanță
                    </h2>
                    <p
                        className="text-sm sm:text-base max-w-xl leading-relaxed"
                        style={{ color: '#0b0d10' }}
                    >
                        PLANCK este o platformă de învățare construită pentru elevii care nu înțeleg fizica, oferindu-le explicații pas cu pas, exemple relevante și structură acolo unde școala lasă goluri.
                    </p>
                </FadeInUp>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Top Row */}
                    {/* Wide card - left */}
                    <FadeInUp className="lg:col-span-7" delay={0.1}>
                        <VideoCard
                            videoSrc={cards[0].videoSrc}
                            title={cards[0].title}
                            description={cards[0].description}
                            className="h-[300px] sm:h-[350px] lg:h-[380px]"
                        />
                    </FadeInUp>
                    {/* Smaller card - right top */}
                    <FadeInUp className="lg:col-span-5" delay={0.2}>
                        <VideoCard
                            videoSrc={cards[1].videoSrc}
                            title={cards[1].title}
                            description={cards[1].description}
                            className="h-[300px] sm:h-[350px] lg:h-[380px]"
                        />
                    </FadeInUp>

                    {/* Bottom Row */}
                    {/* Smaller card - left bottom */}
                    <FadeInUp className="lg:col-span-5" delay={0.3}>
                        <VideoCard
                            videoSrc={cards[2].videoSrc}
                            title={cards[2].title}
                            description={cards[2].description}
                            className="h-[300px] sm:h-[350px] lg:h-[380px]"
                        />
                    </FadeInUp>
                    {/* Wide card - right */}
                    <FadeInUp className="lg:col-span-7" delay={0.4}>
                        <VideoCard
                            videoSrc={cards[3].videoSrc}
                            title={cards[3].title}
                            description={cards[3].description}
                            className="h-[300px] sm:h-[350px] lg:h-[380px]"
                        />
                    </FadeInUp>
                </div>
            </div>
        </section>
    )
}

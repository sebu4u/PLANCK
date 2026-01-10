"use client"

import { useRef, useState, useEffect } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { FadeInUp } from "@/components/scroll-animations"
import Link from "next/link"

const reviews = [
    {
        title: "„Pentru prima dată, fizica are sens.”",
        body: "La PLANCK nu am învățat formule pe de rost. Am înțeles de ce funcționează lucrurile și asta mi-a schimbat complet modul de a rezolva probleme.",
        author: "— Elev, liceu",
    },
    {
        title: "„Nivel de olimpiadă, explicat clar.”",
        body: "Explicațiile sunt extrem de bine structurate. Chiar și subiectele grele devin logice. Exact ce îți trebuie dacă vrei performanță, nu note de trecere.",
        author: "— Participant la olimpiade",
    },
    {
        title: "„Simți că cineva gândește cu tine.”",
        body: "AI-ul de pe PLANCK nu îți dă doar răspunsul. Te duce pas cu pas prin raționament, exact cum ar face un profesor bun.",
        author: "— Elev clasa a XI-a",
    },
    {
        title: "„Se vede că e construit de cineva care a trecut prin asta.”",
        body: "Problemele, explicațiile și structura sunt făcute de cineva care chiar a făcut fizică la nivel înalt. Nu e un site generic.",
        author: "— Elev calificat la faze superioare",
    },
    {
        title: "„Am câștigat claritate și încredere.”",
        body: "Înainte mă blocam. Acum știu ce întrebări să-mi pun și cum să atac problema. Diferența e enormă.",
        author: "— Elev, profil real",
    },
]

export function ReviewsSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // States - kept for compatibility but no longer blocking buttons
    const [activeIndex, setActiveIndex] = useState(0)

    // Update active index
    const updateScrollState = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft } = scrollContainerRef.current

            // Calculate active index based on scroll position for mobile dots
            const cardWidth = scrollContainerRef.current.firstElementChild?.clientWidth || 0
            if (cardWidth > 0) {
                const newIndex = Math.round(scrollLeft / cardWidth)
                setActiveIndex(newIndex)
            }
        }
    }

    useEffect(() => {
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener("scroll", updateScrollState)
            updateScrollState()
            window.addEventListener("resize", updateScrollState)
            return () => {
                container.removeEventListener("scroll", updateScrollState)
                window.removeEventListener("resize", updateScrollState)
            }
        }
    }, [])

    const scrollByAmount = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const { scrollLeft, scrollWidth, clientWidth } = container;

            // Calculate standard scroll amount (one item)
            const firstCard = container.firstElementChild as HTMLElement;
            const cardWidth = firstCard ? firstCard.clientWidth : clientWidth / 3;
            const gap = 24; // gap-6 is 1.5rem = 24px
            const scrollAmount = cardWidth + gap;

            // Check for loop conditions
            const isAtStart = scrollLeft <= 0;
            const isAtEnd = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 5; // buffer

            if (direction === "left") {
                if (isAtStart) {
                    // Loop to end
                    container.scrollTo({ left: scrollWidth, behavior: "smooth" });
                } else {
                    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
                }
            } else {
                if (isAtEnd) {
                    // Loop to start
                    container.scrollTo({ left: 0, behavior: "smooth" });
                } else {
                    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
                }
            }
        }
    }

    return (
        <section className="bg-[#f6f5f4] py-24 w-full">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Header */}
                <FadeInUp className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Ce spun elevii care chiar au progresat cu PLANCK
                    </h2>
                    <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-normal">
                        PLANCK nu promite „trucuri rapide”.<br className="hidden md:block" />
                        Construim înțelegere profundă, gândire de olimpiadă și încredere în rezolvare.
                    </p>
                </FadeInUp>

                {/* Carousel Container */}
                <FadeInUp delay={0.1} className="relative group">
                    {/* Navigation Buttons (Desktop Only) */}
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -left-4 xl:-left-12 z-10">
                        <button
                            onClick={() => scrollByAmount("left")}
                            className={cn(
                                "p-4 rounded-full bg-white border border-gray-100 shadow-md text-gray-900 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            )}
                            aria-label="Previous review"
                        >
                            <ChevronLeft className="w-6 h-6 stroke-[1.5]" />
                        </button>
                    </div>
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-4 xl:-right-12 z-10">
                        <button
                            onClick={() => scrollByAmount("right")}
                            className={cn(
                                "p-4 rounded-full bg-white border border-gray-100 shadow-md text-gray-900 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            )}
                            aria-label="Next review"
                        >
                            <ChevronRight className="w-6 h-6 stroke-[1.5]" />
                        </button>
                    </div>


                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory md:snap-none scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            scrollBehavior: 'smooth'
                        }}
                    >
                        {reviews.map((review, index) => (
                            <div
                                key={index}
                                className="flex-none w-full md:w-[calc(33.333%_-_16px)] snap-center"
                            >
                                <div className="h-full flex flex-col p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300">
                                    {/* Stars */}
                                    <div className="flex gap-1 mb-5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-1 leading-tight">
                                        {review.title}
                                    </h3>

                                    {/* Body */}
                                    <p className="text-gray-600 leading-relaxed mb-8 line-clamp-4 flex-grow text-[15px]">
                                        {review.body}
                                    </p>

                                    {/* Author */}
                                    <div className="mt-auto pt-4 border-t border-gray-50/50">
                                        <p className="text-sm font-medium text-gray-400">
                                            {review.author}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Indicators */}
                    <div className="flex justify-center gap-2 md:hidden mt-6">
                        {reviews.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    idx === activeIndex ? "bg-gray-900 w-4" : "bg-gray-200"
                                )}
                            />
                        ))}
                    </div>

                </FadeInUp>

                {/* CTA Section */}
                <FadeInUp delay={0.2} className="flex flex-col items-center mt-16">
                    <p className="text-gray-600 text-lg mb-6 font-medium text-center">
                        Alătură-te elevilor care deja învață fizica altfel
                    </p>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-orange-500 blur-lg opacity-50 animate-pulse rounded-full group-hover:opacity-75 transition-opacity duration-300"></div>
                        <Link href="/register">
                            <button className="relative z-10 px-10 py-4 bg-[#1a1d21] text-white font-bold rounded-full border-2 border-orange-500 hover:scale-105 transition-transform duration-300">
                                Vreau să încep acum
                            </button>
                        </Link>
                    </div>
                </FadeInUp>
            </div>
        </section>
    )
}

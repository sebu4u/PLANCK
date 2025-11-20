'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Problem } from '@/data/problems'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { LazyYouTubePlayer, extractYouTubeVideoId } from '@/components/lazy-youtube-player'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const difficultyColors = {
  Ușor: "bg-green-100 text-green-700 border-green-300",
  Mediu: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Avansat: "bg-red-100 text-red-700 border-red-300",
}

function truncateStatement(statement: string, wordCount: number = 15): string {
  if (!statement) return ''
  const words = statement.split(/\s+/)
  if (words.length <= wordCount) return statement
  return words.slice(0, wordCount).join(' ') + '...'
}

export default function HowItWorksSection() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Fetch problems when section becomes visible
  useEffect(() => {
    if (!isVisible) return

    const fetchProblems = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('problems')
          .select('*')
          .in('id', ['M008', 'M310', 'T029'])

        if (error) {
          console.error('Error fetching problems:', error)
          return
        }

        if (data && data.length > 0) {
          setProblems(data as Problem[])
          // Set first problem as selected by default
          setSelectedProblem(data[0] as Problem)
        }
      } catch (error) {
        console.error('Error fetching problems:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProblems()
  }, [isVisible])

  // Observe scroll animation elements after content is loaded
  useEffect(() => {
    if (!isVisible || loading) return

    let observer: IntersectionObserver | null = null
    let elements: NodeListOf<Element> | null = null

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate')
          }
        })
      }, observerOptions)

      // Observe all scroll animation elements in this section
      elements = sectionRef.current?.querySelectorAll(
        '.scroll-animate-fade-up, .scroll-animate-fade-left, .scroll-animate-fade-right, .scroll-animate-scale'
      ) || null
      
      elements?.forEach((el) => {
        // Check if element is already in viewport
        const rect = el.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
        if (isInViewport) {
          el.classList.add('animate')
        } else {
          observer?.observe(el)
        }
      })
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      elements?.forEach((el) => observer?.unobserve(el))
    }
  }, [isVisible, loading])

  const handleProblemClick = (problem: Problem) => {
    setSelectedProblem(problem)
  }

  const selectedVideoId = selectedProblem?.youtube_url 
    ? extractYouTubeVideoId(selectedProblem.youtube_url) 
    : null

  if (!isVisible) {
    return (
      <section ref={sectionRef} className="relative w-full bg-[#0d1117] overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-32"
      style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #050505 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Title and Description - Centered above */}
        <div className="scroll-animate-fade-up text-center mb-10 lg:mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            Vezi cum <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">functioneaza</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Ai acces la sute de probleme explicate pas cu pas. Învață conceptele cheie prin exemple concrete și aplicări practice.
          </p>
        </div>

        {/* Two columns with equal height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          {/* Left Side - Problem Cards */}
          <div className="flex flex-col h-full scroll-animate-fade-left">
            {loading ? (
              <div className="space-y-4 flex-1">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {problems.map((problem) => {
                  const isSelected = selectedProblem?.id === problem.id
                  const difficultyColor = difficultyColors[problem.difficulty as keyof typeof difficultyColors] || "bg-gray-100 text-gray-700 border-gray-300"
                  
                  return (
                    <Card
                      key={problem.id}
                      onClick={() => handleProblemClick(problem)}
                      className={`cursor-pointer transition-all duration-200 border-2 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800/70'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Problem ID with difficulty color */}
                          <Badge 
                            className={`${difficultyColor} font-semibold px-3 py-1 text-sm border`}
                          >
                            {problem.id}
                          </Badge>
                          {/* Category */}
                          <Badge 
                            variant="outline" 
                            className="bg-gray-700/50 text-gray-300 border-gray-600 font-semibold px-3 py-1 text-sm"
                          >
                            {problem.category}
                          </Badge>
                        </div>
                        {/* Truncated statement */}
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {truncateStatement(problem.statement, 15)}
                        </p>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Side - Video Player and Button */}
          <div className="flex flex-col h-full space-y-6 scroll-animate-fade-right">
            {loading ? (
              <Skeleton className="aspect-video w-full rounded-lg flex-1" />
            ) : selectedProblem && selectedVideoId ? (
              <>
                <div className="flex-1 flex flex-col">
                  <LazyYouTubePlayer
                    videoId={selectedVideoId}
                    title={selectedProblem.title}
                    className="rounded-lg"
                  />
                </div>
                <Link href={`/probleme/${selectedProblem.id}`} className="block">
                  <Button
                    size="lg"
                    className="w-full bg-white text-black hover:bg-gray-200 transition-all duration-300 font-semibold text-lg py-6"
                  >
                    Incearca acum
                  </Button>
                </Link>
              </>
            ) : selectedProblem ? (
              <>
                <div className="flex-1 flex flex-col">
                  <div className="aspect-video w-full rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                    <div className="text-center">
                      <p className="text-gray-400 mb-2">Rezolvare video indisponibilă</p>
                      <p className="text-sm text-gray-500">Această problemă nu are încă o rezolvare video</p>
                    </div>
                  </div>
                </div>
                <Link href={`/probleme/${selectedProblem.id}`} className="block">
                  <Button
                    size="lg"
                    className="w-full bg-white text-black hover:bg-gray-200 transition-all duration-300 font-semibold text-lg py-6"
                  >
                    Incearca acum
                  </Button>
                </Link>
              </>
            ) : (
              <div className="aspect-video w-full rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                <p className="text-gray-400">Selectează o problemă pentru a vedea rezolvarea</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}


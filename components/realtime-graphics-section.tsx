"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
 
 export default function RealTimeGraphicsSection() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpening, setIsOpening] = useState(false)

  const handleOpenSketch = async () => {
    if (user) {
      router.push('/sketch/boards')
      return
    }

    if (isOpening) return

    setIsOpening(true)
    try {
      const { data, error } = await supabase
        .from('sketch_boards')
        .insert({ title: 'Untitled', is_public: true })
        .select('id')
        .single()

      if (error || !data?.id) {
        throw new Error(error?.message || 'Nu am putut crea o tablă nouă.')
      }

      router.push(`/sketch/board/${data.id}`)
    } catch (err: any) {
      console.error('Failed to open sketch for guest:', err)
      toast({
        title: 'Nu am putut deschide Sketch',
        description: err?.message || 'Încearcă din nou în câteva momente.',
        variant: 'destructive',
      })
      setIsOpening(false)
    }
  }
  return (
    <section className="relative w-full bg-black -mt-4 sm:-mt-8 lg:-mt-12 xl:-mt-14 2xl:-mt-16 pt-20 sm:pt-24 lg:pt-28 xl:pt-24 2xl:pt-20 pb-16 sm:pb-18 lg:pb-22 xl:pb-18 2xl:pb-16 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Placeholder Image Card */}
          <div className="order-last lg:order-first scroll-animate-fade-left">
            <div className="relative w-full max-w-xl mx-auto overflow-visible">
              {/* Localized orange glow that hugs the card */}
              <div
                className="pointer-events-none absolute -left-20 sm:-left-24 lg:-left-28 top-1/2 -translate-y-1/2 w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(251,146,60,0.8) 0%, rgba(249,115,22,0.4) 40%, rgba(234,88,12,0.12) 65%, transparent 85%)",
                }}
              />
              <div className="relative aspect-[4/3] sm:aspect-[3/2] lg:aspect-video rounded-2xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-70 pointer-events-none" />
                <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />

                <div className="relative w-full h-full">
                  <Image
                    src="/realtime-graph-placeholder.png"
                    alt="Planck Sketch real-time graphing demo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 90vw, 40vw"
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="scroll-animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm uppercase tracking-[0.2em] text-amber-300/90 badge-animated-shine">
              Real-time graphing
            </div>
            <h2 className="scroll-animate-fade-up animate-delay-200 text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Desenează grafice în timp real
            </h2>
            <p className="scroll-animate-fade-up animate-delay-400 text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Transformă orice ecuație într-un grafic instantaneu. Perfect pentru fizică, matematică și informatică –
              vizualizări rapide, curate și precise, direct pe aceeași tablă.
            </p>
          </div>
        </div>

        {/* CTA block under the main grid */}
        <div className="scroll-animate-fade-up animate-delay-400 mt-10 sm:mt-12 lg:mt-14 flex flex-col items-center text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-semibold text-white">
            Infinite Canvas. Infinite Imagination
          </h3>
          <p className="text-sm sm:text-base text-gray-300">
            Try Planck Sketch for free now.
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 transition-all duration-300 px-6 sm:px-8 py-5 text-sm sm:text-base lg:text-lg font-medium rounded-3xl"
            onClick={handleOpenSketch}
            disabled={isOpening}
          >
            {isOpening ? 'Creating board...' : 'Open Sketch'}
          </Button>
        </div>
      </div>
    </section>
  )
}



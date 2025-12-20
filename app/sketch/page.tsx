"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import ColorBends from "@/components/ColorBends"
import { Button } from "@/components/ui/button"
import { GlassImageCard } from "@/components/glass-image-card"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { sketchResourceStructuredData, breadcrumbStructuredData } from "@/lib/structured-data"
import { motion } from "framer-motion"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, ease: "easeOut" }
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export default function SketchPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpening, setIsOpening] = useState(false)
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)

  const handleOpenSketch = async () => {
    if (user) {
      router.push('/sketch/boards')
      return
    }

    if (isOpening) return

    setIsOpening(true)
    try {
      // Generate a random room ID for the guest session
      const roomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      router.push(`/sketch/${roomId}`)
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

  const handleTryFree = async () => {
    if (isCreatingBoard) return

    setIsCreatingBoard(true)
    try {
      if (user) {
        // User is authenticated - create board via API
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) {
          throw new Error('Not authenticated')
        }

        // Generate a unique room ID for PartyKit
        const roomId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

        const response = await fetch('/api/sketch/boards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ title: 'Untitled', roomId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create board')
        }

        const data = await response.json()
        const boardRoomId = data.board.room_id || roomId

        // Redirect to the new board
        router.push(`/sketch/${boardRoomId}`)
      } else {
        // Guest user - generate random room ID and redirect
        const roomId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
        router.push(`/sketch/${roomId}`)
      }
    } catch (err: any) {
      console.error('Failed to create board:', err)
      toast({
        title: 'Nu am putut crea tabla',
        description: err?.message || 'Încearcă din nou în câteva momente.',
        variant: 'destructive',
      })
      setIsCreatingBoard(false)
    }
  }

  const handleSeePlans = () => {
    router.push('/pricing')
  }

  const handleScrollToFeatures = () => {
    const element = document.getElementById('infinite-canvas-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sketchResourceStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData([
            { name: 'Acasă', url: 'https://www.planck.academy/' },
            { name: 'Sketch', url: 'https://www.planck.academy/sketch' },
          ]))
        }}
      />
      <Navigation />

      {/* Hero Section with ColorBends Background */}
      <section className="relative h-screen-mobile w-full overflow-hidden bg-black flex items-center justify-center">
        {/* ColorBends Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <ColorBends
            colors={["#0000ff", "#00ff00", "#ff0000"]}
            rotation={0}
            autoRotate={0}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={0}
            parallax={0}
            noise={0.1}
            transparent
          />
        </div>

        {/* Content Overlay */}
        <motion.div
          className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {/* Label Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700/60 backdrop-blur-sm border border-gray-500/30 mb-4 sm:mb-6"
            variants={fadeInUp}
          >
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <span className="text-xs sm:text-sm md:text-base text-white font-medium">Planck Sketch</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-tight px-2 sm:px-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] max-w-4xl mx-auto"
            variants={fadeInUp}
          >
            <span className="animated-gradient-text">Interactive</span>{" "}
            <span className="text-white">whiteboard for dynamic math</span>
          </motion.h1>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4"
            variants={fadeInUp}
          >
            <Button
              size="lg"
              className="bg-white text-black hover:text-black hover:bg-white/90 hover:shadow-lg hover:shadow-white/30 transition-all duration-300 w-full sm:w-auto sm:flex-initial px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base lg:text-lg font-medium rounded-2xl sm:rounded-3xl"
              onClick={handleOpenSketch}
              disabled={isOpening}
            >
              {isOpening ? 'Creating board...' : 'Open Sketch'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-500/30 text-white hover:text-white hover:bg-white/10 hover:border-white/40 hover:shadow-lg hover:shadow-white/20 transition-all duration-300 w-full sm:w-auto sm:flex-initial px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base lg:text-lg font-medium bg-gray-700/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl"
              onClick={handleScrollToFeatures}
            >
              See How It Works
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* New Section with Solid Background */}
      <section className="relative w-full bg-black min-h-screen">
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-start pt-8 sm:pt-[4vh] md:pt-[6vh] lg:pt-[8vh] xl:pt-[10vh] pb-12 sm:pb-16 md:pb-20">
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
            <div
              className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 w-[60vw] max-w-3xl h-[120%]"
              style={{
                background: "radial-gradient(circle, rgba(239,68,68,0.45) 0%, rgba(239,68,68,0.18) 40%, rgba(239,68,68,0.05) 65%, transparent 85%)"
              }}
            />

            {/* GlassImageCard */}
            <motion.div
              className="relative z-10 w-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <GlassImageCard
                imageUrl="/sketch-image.jpg"
                alt="Sketch Demo"
              />
            </motion.div>

            <motion.div
              id="infinite-canvas-section"
              className="relative z-10 w-full max-w-4xl text-center space-y-3 sm:space-y-4 px-2 sm:px-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                Infinite Canvas. Multi-Page Freedom.
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 leading-relaxed">
                Create your own workspace with total control. Planck Sketch combines an infinite canvas with multiple customizable pages in one project — so your ideas never run out of space.
              </p>
            </motion.div>

          </div>

          <motion.div
            className="relative z-10 w-full max-w-5xl mx-auto mt-12 sm:mt-16 md:mt-20 grid gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="group relative bg-white/10 backdrop-blur-md border border-white/15 rounded-xl sm:rounded-lg p-4 sm:p-3.5 md:p-4.5 shadow-xl overflow-hidden w-full max-w-sm mx-auto lg:max-w-none lg:mx-0"
              initial={{ opacity: 0, y: 30, x: 0 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex flex-col gap-3 sm:gap-2.5">
                <div className="bg-white/10 border border-white/15 rounded-lg sm:rounded-md overflow-hidden shadow-inner">
                  <div className="aspect-[4/3] sm:aspect-[4/3] w-full relative">
                    <Image
                      src="/sketch-board-snapshots.png"
                      alt="Board snapshots at a glance"
                      fill
                      className="object-cover"
                      priority
                      quality={95}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-1">
                  <h3 className="text-base sm:text-sm md:text-base font-semibold text-white leading-tight">Board snapshots at a glance</h3>
                  <p className="text-xs sm:text-[0.7rem] md:text-xs text-white/65 leading-relaxed sm:leading-relaxed">
                    Preview and refine ideas inside a focused workspace that mirrors the Sketch boards experience.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative z-10 flex flex-col items-center text-center gap-4 sm:gap-5 md:gap-6 px-4 sm:px-2 md:px-8"
              initial={{ opacity: 0, y: 30, x: 0 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white uppercase tracking-[0.2em] sm:tracking-[0.32em] text-white/70">What you can do</h3>
              <motion.ul
                className="space-y-3 sm:space-y-4 text-sm sm:text-base text-white/85 max-w-lg w-full"
                variants={containerVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
              >
                <motion.li
                  className="flex items-start gap-3 sm:gap-4 text-left sm:text-center"
                  variants={fadeInUp}
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0"></span>
                  <span>Create or personalize boards with one click</span>
                </motion.li>
                <motion.li
                  className="flex items-start gap-3 sm:gap-4 text-left sm:text-center"
                  variants={fadeInUp}
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0"></span>
                  <span>Load and display uploaded files directly on your board</span>
                </motion.li>
                <motion.li
                  className="flex items-start gap-3 sm:gap-4 text-left sm:text-center"
                  variants={fadeInUp}
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0"></span>
                  <span>Organize concepts, lessons, or projects in a single place</span>
                </motion.li>
              </motion.ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="relative w-full bg-black py-12 sm:py-16 md:py-24">
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 grid gap-8 sm:gap-12 lg:gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
          <motion.div
            className="space-y-4 sm:space-y-6 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Bring equations to <span className="animated-gradient-text">life.</span>
            </h2>
            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
              <p>
                Type any equation and watch its graph appear instantly — right inside your workspace. No switching tools, no waiting.
              </p>
              <p>
                Planck Sketch integrates real-time math visualization that makes every concept intuitive and dynamic.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="relative w-full max-w-sm mx-auto lg:max-w-md lg:ml-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <div className="absolute left-[45%] top-[70%] -translate-x-1/2 w-[65%] max-w-sm h-[120%] bg-gradient-to-b from-blue-400/30 via-blue-500/12 to-transparent blur-3xl pointer-events-none"></div>
            <div className="relative z-10 w-full rounded-xl sm:rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="absolute -inset-x-16 -top-12 h-32 bg-gradient-to-br from-red-500/20 via-transparent to-transparent blur-3xl pointer-events-none"></div>
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/equations-to-life.png"
                  alt="Real-time equation graphing visualization"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative w-full bg-black py-12 sm:py-16 md:py-24">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
          <motion.div
            className="space-y-3 sm:space-y-4 text-center px-2 sm:px-0"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Work together, learn together
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
              Invite anyone to join your board — no account required.
              <br className="hidden sm:block" />
              Every stroke, line, or note updates instantly for all participants. Whether you're teaching, brainstorming, or coding formulas, Planck Sketch keeps everyone in sync.
            </p>
          </motion.div>

          <motion.div
            className="relative w-full max-w-4xl mx-auto grid gap-3 sm:gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <div className="pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 w-[80%] max-w-2xl h-[130%] bg-gradient-to-b from-emerald-400/15 via-emerald-500/08 to-transparent blur-[100px]"></div>
            <motion.div
              className="flex items-start gap-3 sm:gap-4 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 backdrop-blur"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            >
              <span className="mt-0.5 sm:mt-1 h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span className="text-sm sm:text-base text-white/85 leading-relaxed">Real-time updates for multiple users</span>
            </motion.div>
            <motion.div
              className="flex items-start gap-3 sm:gap-4 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 backdrop-blur"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
            >
              <span className="mt-0.5 sm:mt-1 h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span className="text-sm sm:text-base text-white/85 leading-relaxed">Share via link — no sign-up needed</span>
            </motion.div>
            <motion.div
              className="flex items-start gap-3 sm:gap-4 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 backdrop-blur"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
            >
              <span className="mt-0.5 sm:mt-1 h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span className="text-sm sm:text-base text-white/85 leading-relaxed">Save your boards with an account and pick up where you left off</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="relative w-full bg-black py-12 sm:py-16 md:py-24">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid gap-8 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center">
          <motion.div
            className="space-y-4 sm:space-y-6 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="space-y-3 sm:space-y-4 text-white/85 text-sm sm:text-base md:text-lg leading-relaxed">
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-semibold leading-tight">
                Start sketching in seconds. You don't even need an account — just click, draw, and share.
              </p>
              <p className="text-sm sm:text-base md:text-lg">
                Upgrade anytime for advanced features and AI assistance.
              </p>
            </div>
            <motion.div
              className="flex justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            >
              <Button
                className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg rounded-full bg-white text-black hover:bg-gray-200 transition w-full sm:w-auto"
                onClick={handleTryFree}
                disabled={isCreatingBoard}
              >
                {isCreatingBoard ? 'Creating board...' : 'Try Planck Sketch Free'}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative w-full max-w-md mx-auto lg:max-w-3xl lg:ml-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <div
              className="relative z-10 w-full aspect-[3/2] rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl"
              style={{
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              }}
            >
              {/* Glass effect layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

              {/* Image */}
              <div className="relative w-full h-full">
                <Image
                  src="/plus.jpg"
                  alt="Start sketching in seconds"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative w-full h-auto min-h-[500px] sm:h-80vh-mobile md:h-100vh-mobile md:min-h-[640px] overflow-hidden py-12 sm:py-0">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/sketch-ai-placeholder.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-full h-full flex items-center justify-center py-12 sm:py-0">
          <motion.div
            className="w-full max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="relative backdrop-blur-xl bg-white/80 border border-white/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight drop-shadow-sm">
                Your intelligent sketch assistant
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mt-3 sm:mt-4">
                Activate AI Mode and let Planck understand your ideas.
                <br className="hidden sm:block" />
                It scans your drawings, equations, or notes — then helps you solve, explain, or visualize them in real time. Perfect for students, teachers, and creators who want more than just a whiteboard.
              </p>
              <motion.div
                className="mt-5 sm:mt-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
              >
                <Button
                  className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg rounded-full bg-gray-900 text-white hover:bg-gray-800 transition shadow-lg w-full sm:w-auto"
                  onClick={handleSeePlans}
                >
                  see plans
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer backgroundColor="bg-black" />
    </div>
  )
}


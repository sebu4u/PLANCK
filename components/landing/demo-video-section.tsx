"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeInLeft, FadeInRight } from "@/components/scroll-animations"
import { LazyYouTubePlayer } from "@/components/lazy-youtube-player"

/** ID YouTube al rezolvării demo. Schimbă când ai clipul final. */
const DEMO_YOUTUBE_VIDEO_ID = "QBTWRag_3Ls"

export function LandingDemoVideoSection() {
  return (
    <section className="overflow-x-hidden bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <FadeInRight>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Vezi cum explicăm înainte să începi
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
              Urmărește un scurt demo video ca să vezi cum predăm. Apoi poți începe cu prima
              pregătire complet gratuită, din partea noastră.
            </p>
            <Link
              href="/register"
              className="mt-8 hidden h-14 items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 lg:inline-flex"
            >
              Vreau prima pregătire gratuită
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </FadeInRight>

          <FadeInLeft>
            <div className="overflow-hidden rounded-[24px] shadow-[0_16px_48px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.06]">
              <LazyYouTubePlayer
                videoId={DEMO_YOUTUBE_VIDEO_ID}
                title="Demo rezolvare PLANCK"
                className="rounded-none shadow-none"
              />
            </div>
            <Link
              href="/register"
              className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 lg:hidden"
            >
              Vreau prima pregătire gratuită
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </FadeInLeft>
        </div>
      </div>
    </section>
  )
}

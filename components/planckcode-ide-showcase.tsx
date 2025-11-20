"use client"

import dynamic from "next/dynamic"
import { PlanckCodeSettingsProvider } from "@/components/planckcode-settings-provider"
import { PlanckCodeContentWrapper } from "@/components/planckcode-content-wrapper"

const EmbeddedIDE = dynamic(() => import("./coding-problems/embedded-ide"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto" />
        <p className="text-sm text-white/60">Se încarcă IDE-ul...</p>
      </div>
    </div>
  ),
})

export default function PlanckCodeIDEShowcase() {
  return (
    <PlanckCodeSettingsProvider>
      <PlanckCodeContentWrapper className="bg-[#0d0d0d] py-20" innerClassName="max-w-7xl">
        <section className="relative">
          {/* Radial glow effect above the card */}
          <div className="relative flex justify-center mb-8">
            <div className="absolute top-0 w-[800px] h-[400px] bg-gradient-radial from-blue-300/60 via-indigo-300/40 to-transparent rounded-full blur-3xl"></div>
          </div>

          {/* Large glass-effect card */}
          <div className="relative scroll-animate-fade-up">
            {/* Outer card with glass effect */}
            <div className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-[#7dd3fc]/15 via-[#93c5fd]/10 to-transparent blur-xl opacity-50 pointer-events-none" aria-hidden="true"></div>
            <div className="absolute -inset-6 rounded-[2.4rem] bg-gradient-to-tr from-[#4f46e5]/8 via-[#0ea5e9]/4 to-transparent blur-2xl opacity-40 pointer-events-none" aria-hidden="true"></div>
            <div 
              className="relative w-full h-[600px] md:h-[700px] rounded-[2rem] border border-white/20 overflow-hidden"
              style={{ touchAction: 'pan-y' }}
            >
              {/* Glass background layers */}
              <div className="absolute inset-0 bg-white/5 rounded-[2rem] backdrop-blur-xl"></div>
              <div className="absolute inset-0 bg-white/3 rounded-[2rem] backdrop-blur-lg"></div>
              
              {/* Subtle gradient glow */}
              <div className="absolute inset-0 rounded-[2rem]" style={{background: 'linear-gradient(to top, rgba(59, 130, 246, 0.2) 0%, rgba(147, 197, 253, 0.1) 15%, rgba(147, 197, 253, 0.05) 25%, transparent 50%)'}}></div>
              
              {/* IDE container */}
              <div 
                className="relative h-full overflow-hidden rounded-[2rem]"
                style={{ touchAction: 'pan-y' }}
              >
                <EmbeddedIDE />
              </div>
            </div>
          </div>

        </section>
      </PlanckCodeContentWrapper>
    </PlanckCodeSettingsProvider>
  )
}


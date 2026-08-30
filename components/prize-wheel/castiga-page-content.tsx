"use client"

import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { Landing1LeuHeroConfetti } from "@/components/landing-1leu/hero-confetti"
import { CastigaLoginDialog } from "@/components/prize-wheel/castiga-login-dialog"
import { PrizeWheelExperience } from "@/components/prize-wheel/prize-wheel-experience"
import { CastigaRulesSection } from "@/components/prize-wheel/castiga-rules-section"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

export function CastigaPageContent() {
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(() => !user)

  useEffect(() => {
    if (user) setLoginOpen(false)
  }, [user])

  const openLogin = useCallback(() => setLoginOpen(true), [])

  return (
    <>
      <main className={MOBILE_BOTTOM_NAV_PADDING_CLASS}>
        <section className="relative min-h-[100svh] overflow-hidden bg-[linear-gradient(to_bottom,#c8e6ff_0%,#e8f4ff_42%,#ffffff_82%)]">
          <Landing1LeuHeroConfetti />
          <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-4 pb-28 pt-24 sm:px-6 sm:pb-16">
            <PrizeWheelExperience variant="page" onAuthRequired={openLogin} />
          </div>
        </section>
        <CastigaRulesSection />
      </main>
      <CastigaLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}

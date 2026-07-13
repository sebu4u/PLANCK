"use client"

import { LpTestBatteryStrip } from "@/components/invata/lp-test-battery-strip"
import { NavbarInfoTooltip } from "@/components/navbar-info-tooltip"
import { LP_TEST_MAX_BATTERIES, useLpTestBatteryState } from "@/hooks/use-lp-test-battery-state"

interface NavbarTestBatteriesProps {
  useLightNav: boolean
  variant?: "compact" | "pill"
}

export function NavbarTestBatteries({ useLightNav, variant = "compact" }: NavbarTestBatteriesProps) {
  const { state, loading } = useLpTestBatteryState()
  const count = state?.count ?? 0

  return (
    <NavbarInfoTooltip
      useLightNav={useLightNav}
      ariaLabel={`${count} din ${LP_TEST_MAX_BATTERIES} baterii de test disponibile`}
      title="Bateriile de test"
      description="Îți permit să începi teste în parcursul de învățare. Fiecare test consumă o baterie, iar bateriile se reîncarcă în 12 ore."
      footer={loading ? undefined : `Ai ${count} din ${LP_TEST_MAX_BATTERIES} baterii disponibile.`}
    >
      {loading ? (
        <span className="inline-flex opacity-50" aria-hidden>
          <LpTestBatteryStrip count={0} variant={variant} useLightNav={useLightNav} />
        </span>
      ) : (
        <LpTestBatteryStrip count={count} variant={variant} useLightNav={useLightNav} />
      )}
    </NavbarInfoTooltip>
  )
}

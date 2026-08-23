"use client"

import { useCallback, useEffect, useRef } from "react"

import { trackFunnelEvent } from "@/lib/funnel-analytics"

type OnboardingFlow = "student" | "guardian"

type UseOnboardingFunnelInput = {
  flow: OnboardingFlow
  step: string | number
  stepName: string
  extra?: Record<string, unknown>
  enabled: boolean
}

export function useOnboardingFunnel({
  flow,
  step,
  stepName,
  extra,
  enabled,
}: UseOnboardingFunnelInput) {
  const startedRef = useRef(false)
  const completedRef = useRef(false)
  const abandonedRef = useRef(false)
  const flowStartedAtRef = useRef(Date.now())
  const stepEnteredAtRef = useRef(Date.now())
  const prevStepRef = useRef<string | number | null>(null)
  const prevStepNameRef = useRef<string | null>(null)
  const latestRef = useRef({ step, stepName, extra })
  latestRef.current = { step, stepName, extra }

  useEffect(() => {
    if (!enabled) return

    if (!startedRef.current) {
      startedRef.current = true
      flowStartedAtRef.current = Date.now()
      stepEnteredAtRef.current = Date.now()
      trackFunnelEvent("onboarding_started", {
        flow,
        step,
        step_name: stepName,
        ...extra,
      })
      trackFunnelEvent("onboarding_step_viewed", {
        flow,
        step,
        step_name: stepName,
        ...extra,
      })
      prevStepRef.current = step
      prevStepNameRef.current = stepName
      return
    }

    if (prevStepRef.current === step) return

    trackFunnelEvent("onboarding_step_completed", {
      flow,
      step: prevStepRef.current,
      step_name: prevStepNameRef.current,
      time_ms: Date.now() - stepEnteredAtRef.current,
    })
    stepEnteredAtRef.current = Date.now()
    prevStepRef.current = step
    prevStepNameRef.current = stepName
    trackFunnelEvent("onboarding_step_viewed", {
      flow,
      step,
      step_name: stepName,
      ...latestRef.current.extra,
    })
  }, [enabled, flow, step, stepName])

  const fireAbandoned = useCallback(() => {
    if (!startedRef.current || completedRef.current || abandonedRef.current) return
    abandonedRef.current = true
    const current = latestRef.current
    trackFunnelEvent("onboarding_abandoned", {
      flow,
      last_step: current.step,
      last_step_name: current.stepName,
      time_on_step_ms: Date.now() - stepEnteredAtRef.current,
      time_total_ms: Date.now() - flowStartedAtRef.current,
      ...current.extra,
    })
  }, [flow])

  useEffect(() => {
    if (!enabled) return

    const onPageHide = () => fireAbandoned()
    window.addEventListener("pagehide", onPageHide)
    return () => {
      window.removeEventListener("pagehide", onPageHide)
      fireAbandoned()
    }
  }, [enabled, fireAbandoned])

  const markCompleted = useCallback(
    (properties?: Record<string, unknown>) => {
      completedRef.current = true
      trackFunnelEvent("onboarding_completed", {
        flow,
        time_total_ms: Date.now() - flowStartedAtRef.current,
        ...latestRef.current.extra,
        ...properties,
      })
    },
    [flow],
  )

  return { markCompleted }
}

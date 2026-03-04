"use client"

import { PhysicsProjectileSim } from "./PhysicsProjectileSim"
import { PhysicsCircuitSim } from "./PhysicsCircuitSim"
import { PhysicsPendulumSim } from "./PhysicsPendulumSim"
import { PhysicsAtomSim } from "./PhysicsAtomSim"
import { CsPathfindingSim } from "./CsPathfindingSim"

type SubjectOption = "fizica" | "informatica"
type GradeOption = "9" | "10" | "11" | "12"

const SIM_LABELS: Record<string, string> = {
  "fizica-9": "Aruncare de proiectile",
  "fizica-10": "Circuit electric",
  "fizica-11": "Oscilații cu pendul",
  "fizica-12": "Modelul atomic",
  informatica: "Algoritm de pathfinding",
}

export function OnboardingSimulationCard({
  subject,
  grade,
}: {
  subject: SubjectOption
  grade: GradeOption
}) {
  const key = subject === "informatica" ? "informatica" : `${subject}-${grade}`
  const label = SIM_LABELS[key] ?? "Simulare interactivă"

  const renderSim = () => {
    if (subject === "informatica") return <CsPathfindingSim />
    switch (grade) {
      case "9":
        return <PhysicsProjectileSim />
      case "10":
        return <PhysicsCircuitSim />
      case "11":
        return <PhysicsPendulumSim />
      case "12":
        return <PhysicsAtomSim />
      default:
        return <PhysicsProjectileSim />
    }
  }

  return (
    <div className="rounded-2xl border border-[#e1e1e5] bg-white p-3.5 shadow-[0_18px_40px_-30px_rgba(41,41,41,0.35)] sm:rounded-3xl sm:p-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#292929] sm:text-[10px] sm:tracking-[0.2em]">
        {label}
      </p>
      <div className="mt-2.5 sm:mt-4">{renderSim()}</div>
    </div>
  )
}

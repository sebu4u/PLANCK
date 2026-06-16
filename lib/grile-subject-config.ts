import type { LucideIcon } from "lucide-react"
import { Atom, Beaker, BookOpen, Dna, GraduationCap, Leaf, Microscope } from "lucide-react"
import type { GradeLevel } from "@/lib/types/quiz-questions"

export type GrileMaterie = "fizica" | "biologie"

export interface GrileSubjectConfig {
  materie: GrileMaterie
  pageTitle: string
  pageSubtitle: string
  catalogPath: string
  backHref: string
  backLabel: string
  multiSelect: boolean
  insightStarterChips: string[]
  classDescriptions: Record<GradeLevel, string>
  classIcons: Record<GradeLevel, LucideIcon>
}

export const FIZICA_GRILE_CONFIG: GrileSubjectConfig = {
  materie: "fizica",
  pageTitle: "Teste Grilă Fizică",
  pageSubtitle: "Alege clasa pentru a începe testul",
  catalogPath: "/grile",
  backHref: "/exerseaza",
  backLabel: "Înapoi la Exersează",
  multiSelect: false,
  insightStarterChips: [
    "Ce concept fizic stă la baza acestei grile?",
    "Cum pot elimina rațional variantele greșite?",
    "Explică enunțul cu alte cuvinte, pas cu pas.",
  ],
  classDescriptions: {
    9: "Mecanică, Optică",
    10: "Termodinamică, Electricitate",
    11: "Electrodinamică, Oscilații",
    12: "Fizică atomică, Fizică nucleară",
  },
  classIcons: {
    9: Atom,
    10: Beaker,
    11: BookOpen,
    12: GraduationCap,
  },
}

export const BIOLOGIE_GRILE_CONFIG: GrileSubjectConfig = {
  materie: "biologie",
  pageTitle: "Teste Grilă Biologie",
  pageSubtitle: "Alege clasa pentru a începe testul",
  catalogPath: "/biologie/grile",
  backHref: "/invata",
  backLabel: "Înapoi la Învață",
  multiSelect: true,
  insightStarterChips: [
    "Ce concept biologic stă la baza acestei grile?",
    "Cum pot elimina rațional variantele greșite?",
    "Explică enunțul cu alte cuvinte, pas cu pas.",
  ],
  classDescriptions: {
    9: "Celula, organisme unicelulare",
    10: "Sisteme de organe, ecologie",
    11: "Genetică, evoluție",
    12: "Biologie moleculară, biotehnologii",
  },
  classIcons: {
    9: Leaf,
    10: Microscope,
    11: Dna,
    12: BookOpen,
  },
}

export function getGrileSubjectConfig(materie: GrileMaterie): GrileSubjectConfig {
  return materie === "biologie" ? BIOLOGIE_GRILE_CONFIG : FIZICA_GRILE_CONFIG
}

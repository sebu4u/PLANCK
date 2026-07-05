import type { LucideIcon } from "lucide-react"
import { Atom, Calculator, Code2 } from "lucide-react"

export type InvataSubjectId = "fizica" | "mate" | "info"

export interface InvataSubjectConfig {
  id: InvataSubjectId
  label: string
  icon: LucideIcon
  href: string
}

/** Materii disponibile în hub — extinde lista când se adaugă noi trasee. */
export const INVATA_SUBJECTS: InvataSubjectConfig[] = [
  {
    id: "fizica",
    label: "Fizică",
    icon: Atom,
    href: "/invata/fizica",
  },
  {
    id: "mate",
    label: "Matematică",
    icon: Calculator,
    href: "/invata/mate",
  },
  {
    id: "info",
    label: "Informatică",
    icon: Code2,
    href: "/invata/info",
  },
]
